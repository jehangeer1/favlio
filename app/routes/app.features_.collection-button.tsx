import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import "../styles/collection-button-settings.css";

const placements = [
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
] as const;
const iconStyles = ["heart", "star", "bookmark", "custom"] as const;
const iconAnimations = ["none", "pulse", "bounce", "rotate"] as const;

type Placement = (typeof placements)[number];
type IconStyle = (typeof iconStyles)[number];
type IconAnimation = (typeof iconAnimations)[number];
type PreviewDevice = "desktop" | "tablet" | "mobile";

type CollectionSettings = {
  enabled: boolean;
  placement: Placement;
  customPosition: boolean;
  backgroundColor: string;
  activeBackgroundColor: string;
  padding: number;
  borderRadius: number;
  showOnHover: boolean;
  overrideIconStyle: boolean;
  iconStyle: IconStyle;
  iconAnimation: IconAnimation;
  iconColor: string;
  activeIconColor: string;
  iconSize: number;
};

const defaults: CollectionSettings = {
  enabled: false,
  placement: "top_right",
  customPosition: false,
  backgroundColor: "#FFFFFFE8",
  activeBackgroundColor: "#7212DA",
  padding: 5,
  borderRadius: 50,
  showOnHover: true,
  overrideIconStyle: true,
  iconStyle: "heart",
  iconAnimation: "none",
  iconColor: "#737373",
  activeIconColor: "#FFFFFF",
  iconSize: 22,
};

function isOneOf<T extends string>(
  value: string,
  options: readonly T[],
): value is T {
  return options.includes(value as T);
}

function asSettings(
  value?: Partial<Record<keyof CollectionSettings, unknown>> | null,
): CollectionSettings {
  const placement = String(value?.placement ?? "");
  const iconStyle = String(value?.iconStyle ?? "");
  const iconAnimation = String(value?.iconAnimation ?? "");

  return {
    enabled:
      typeof value?.enabled === "boolean" ? value.enabled : defaults.enabled,
    placement: isOneOf(placement, placements) ? placement : defaults.placement,
    customPosition:
      typeof value?.customPosition === "boolean"
        ? value.customPosition
        : defaults.customPosition,
    backgroundColor:
      typeof value?.backgroundColor === "string"
        ? value.backgroundColor
        : defaults.backgroundColor,
    activeBackgroundColor:
      typeof value?.activeBackgroundColor === "string"
        ? value.activeBackgroundColor
        : defaults.activeBackgroundColor,
    padding:
      typeof value?.padding === "number" ? value.padding : defaults.padding,
    borderRadius:
      typeof value?.borderRadius === "number"
        ? value.borderRadius
        : defaults.borderRadius,
    showOnHover:
      typeof value?.showOnHover === "boolean"
        ? value.showOnHover
        : defaults.showOnHover,
    overrideIconStyle:
      typeof value?.overrideIconStyle === "boolean"
        ? value.overrideIconStyle
        : defaults.overrideIconStyle,
    iconStyle: isOneOf(iconStyle, iconStyles) ? iconStyle : defaults.iconStyle,
    iconAnimation: isOneOf(iconAnimation, iconAnimations)
      ? iconAnimation
      : defaults.iconAnimation,
    iconColor:
      typeof value?.iconColor === "string"
        ? value.iconColor
        : defaults.iconColor,
    activeIconColor:
      typeof value?.activeIconColor === "string"
        ? value.activeIconColor
        : defaults.activeIconColor,
    iconSize:
      typeof value?.iconSize === "number" ? value.iconSize : defaults.iconSize,
  };
}

function colorValue(value: FormDataEntryValue | null, fallback: string) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color)
    ? color.toUpperCase()
    : fallback;
}

function numberValue(
  value: FormDataEntryValue | null,
  min: number,
  max: number,
  fallback: number,
) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, Math.round(parsed)))
    : fallback;
}

function booleanValue(formData: FormData, name: string) {
  return formData.get(name) === "true";
}

function settingsFromForm(formData: FormData): CollectionSettings {
  const placement = String(formData.get("placement") ?? "");
  const iconStyle = String(formData.get("iconStyle") ?? "");
  const iconAnimation = String(formData.get("iconAnimation") ?? "");

  return {
    enabled: booleanValue(formData, "enabled"),
    placement: isOneOf(placement, placements) ? placement : defaults.placement,
    customPosition: booleanValue(formData, "customPosition"),
    backgroundColor: colorValue(
      formData.get("backgroundColor"),
      defaults.backgroundColor,
    ),
    activeBackgroundColor: colorValue(
      formData.get("activeBackgroundColor"),
      defaults.activeBackgroundColor,
    ),
    padding: numberValue(formData.get("padding"), 0, 24, defaults.padding),
    borderRadius: numberValue(
      formData.get("borderRadius"),
      0,
      50,
      defaults.borderRadius,
    ),
    showOnHover: booleanValue(formData, "showOnHover"),
    overrideIconStyle: booleanValue(formData, "overrideIconStyle"),
    iconStyle: isOneOf(iconStyle, iconStyles) ? iconStyle : defaults.iconStyle,
    iconAnimation: isOneOf(iconAnimation, iconAnimations)
      ? iconAnimation
      : defaults.iconAnimation,
    iconColor: colorValue(formData.get("iconColor"), defaults.iconColor),
    activeIconColor: colorValue(
      formData.get("activeIconColor"),
      defaults.activeIconColor,
    ),
    iconSize: numberValue(formData.get("iconSize"), 12, 48, defaults.iconSize),
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const stored = await prisma.collectionButtonSettings.findUnique({
    where: { shop: session.shop },
  });

  return {
    settings: asSettings(stored),
    shop: session.shop,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = settingsFromForm(await request.formData());

  const saved = await prisma.collectionButtonSettings.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...settings },
    update: settings,
  });

  return { ok: true, settings: asSettings(saved) };
};

const iconGlyphs: Record<IconStyle, string> = {
  heart: "♥",
  star: "★",
  bookmark: "▮",
  custom: "✦",
};

export default function CollectionButtonSettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [savedSettings, setSavedSettings] = useState(loaderData.settings);
  const [draft, setDraft] = useState(loaderData.settings);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (fetcher.data?.ok) {
      setSavedSettings(fetcher.data.settings);
      setDraft(fetcher.data.settings);
      shopify.toast.show("Collection button settings saved");
    }
  }, [fetcher.data, shopify]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSettings),
    [draft, savedSettings],
  );
  const isSaving = fetcher.state !== "idle";
  const activeBackground = previewActive
    ? draft.activeBackgroundColor
    : draft.backgroundColor;
  const activeColor = previewActive ? draft.activeIconColor : draft.iconColor;
  const themeEditorUrl = `https://${loaderData.shop}/admin/themes/current/editor?context=apps`;
  const previewWidths: Record<PreviewDevice, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };
  const previewLabels: Record<PreviewDevice, string> = {
    desktop: "Full width",
    tablet: "768px",
    mobile: "390px",
  };

  const update = <Key extends keyof CollectionSettings>(
    key: Key,
    value: CollectionSettings[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <s-page heading="Collection button settings">
      <s-button
        slot="secondary-actions"
        disabled={!isDirty || isSaving}
        onClick={() => setDraft(savedSettings)}
      >
        Discard
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        loading={isSaving}
        disabled={!isDirty}
        onClick={() => formRef.current?.requestSubmit()}
      >
        Save
      </s-button>

      <div className="collection-editor-screen">
        <div className="collection-device-toolbar">
          <s-badge tone={isDirty ? "warning" : "success"}>
            {isDirty ? "Unsaved changes" : "Saved"}
          </s-badge>
          <div className="collection-device-actions">
            <span className="collection-preview-size">
              {previewLabels[previewDevice]}, 100%
            </span>
            <div
              className="collection-device-switcher"
              role="group"
              aria-label="Preview size"
            >
              {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map(
                (device) => (
                  <button
                    type="button"
                    key={device}
                    className={previewDevice === device ? "active" : ""}
                    aria-label={`${device} preview`}
                    aria-pressed={previewDevice === device}
                    onClick={() => setPreviewDevice(device)}
                  >
                    <span className={`device-icon device-${device}`} />
                  </button>
                ),
              )}
            </div>
            <s-link href={themeEditorUrl} target="_blank">
              Open theme editor
            </s-link>
          </div>
        </div>

        <fetcher.Form
          ref={formRef}
          method="post"
          className="collection-settings-layout"
          onReset={(event) => {
            event.preventDefault();
            setDraft(savedSettings);
          }}
        >
          {Object.entries(draft).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={String(value)} />
          ))}

          <aside className="collection-settings-panel">
            <div className="collection-settings-title">
              <div>
                <h2>Button settings</h2>
                <p>
                  Control how the wishlist action appears on collection cards.
                </p>
              </div>
              <s-switch
                label="Enable collection button"
                checked={draft.enabled}
                onChange={(event) =>
                  update("enabled", event.currentTarget.checked)
                }
              />
            </div>

            <s-select
              label="Placement"
              value={draft.placement}
              onChange={(event) =>
                update("placement", event.currentTarget.value as Placement)
              }
            >
              <s-option value="top_left">Top left</s-option>
              <s-option value="top_right">Top right</s-option>
              <s-option value="bottom_left">Bottom left</s-option>
              <s-option value="bottom_right">Bottom right</s-option>
            </s-select>

            <s-switch
              label="Enable custom position"
              details="Adjust the button position using the selected corner as its anchor."
              checked={draft.customPosition}
              onChange={(event) =>
                update("customPosition", event.currentTarget.checked)
              }
            />

            <s-color-field
              label="Background color"
              value={draft.backgroundColor}
              alpha
              onInput={(event) =>
                update("backgroundColor", event.currentTarget.value)
              }
            />
            <s-color-field
              label="Background color when active"
              value={draft.activeBackgroundColor}
              alpha
              onInput={(event) =>
                update("activeBackgroundColor", event.currentTarget.value)
              }
            />

            <label className="collection-range-field">
              <span>Padding</span>
              <div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={draft.padding}
                  onChange={(event) =>
                    update("padding", Number(event.currentTarget.value))
                  }
                />
                <output>{draft.padding}px</output>
              </div>
            </label>
            <label className="collection-range-field">
              <span>Border radius</span>
              <div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={draft.borderRadius}
                  onChange={(event) =>
                    update("borderRadius", Number(event.currentTarget.value))
                  }
                />
                <output>{draft.borderRadius}%</output>
              </div>
            </label>

            <s-switch
              label="Show when hovering"
              details="Show the button only when a desktop shopper hovers over a product card."
              checked={draft.showOnHover}
              onChange={(event) =>
                update("showOnHover", event.currentTarget.checked)
              }
            />
            <s-switch
              label="Override icon style"
              details="Use a collection-specific icon instead of the global wishlist icon."
              checked={draft.overrideIconStyle}
              onChange={(event) =>
                update("overrideIconStyle", event.currentTarget.checked)
              }
            />

            <fieldset
              className="collection-icon-options"
              disabled={!draft.overrideIconStyle}
            >
              <legend>Icon style</legend>
              <div>
                {iconStyles.map((style) => (
                  <button
                    type="button"
                    key={style}
                    className={draft.iconStyle === style ? "active" : ""}
                    aria-pressed={draft.iconStyle === style}
                    onClick={() => update("iconStyle", style)}
                  >
                    <span>{iconGlyphs[style]}</span>
                    {style}
                  </button>
                ))}
              </div>
            </fieldset>

            <s-select
              label="Icon animation"
              value={draft.iconAnimation}
              disabled={!draft.overrideIconStyle}
              onChange={(event) =>
                update(
                  "iconAnimation",
                  event.currentTarget.value as IconAnimation,
                )
              }
            >
              <s-option value="none">None</s-option>
              <s-option value="pulse">Pulse</s-option>
              <s-option value="bounce">Bounce</s-option>
              <s-option value="rotate">Rotate</s-option>
            </s-select>

            <s-color-field
              label="Icon color"
              value={draft.iconColor}
              onInput={(event) =>
                update("iconColor", event.currentTarget.value)
              }
            />
            <s-color-field
              label="Icon color when active"
              value={draft.activeIconColor}
              onInput={(event) =>
                update("activeIconColor", event.currentTarget.value)
              }
            />

            <label className="collection-range-field">
              <span>Icon size</span>
              <div>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={draft.iconSize}
                  onChange={(event) =>
                    update("iconSize", Number(event.currentTarget.value))
                  }
                />
                <output>{draft.iconSize}px</output>
              </div>
            </label>
          </aside>

          <main className="collection-preview-area">
            <div
              className={`collection-preview-viewport preview-${previewDevice}`}
              style={{ maxWidth: previewWidths[previewDevice] }}
            >
              <div className="collection-preview-note">
                Live preview — your theme’s fonts and product imagery may
                differ.
              </div>
              <div className="collection-product-card">
                <div className="collection-product-image">
                  <button
                    type="button"
                    className={`collection-preview-button placement-${draft.placement} animation-${draft.iconAnimation}${draft.showOnHover ? " preview-hover-only" : ""}`}
                    aria-label={
                      previewActive ? "Remove from wishlist" : "Add to wishlist"
                    }
                    aria-pressed={previewActive}
                    onClick={() => setPreviewActive((current) => !current)}
                    style={{
                      background: activeBackground,
                      borderRadius: `${draft.borderRadius}%`,
                      color: activeColor,
                      fontSize: `${draft.iconSize}px`,
                      padding: `${draft.padding}px`,
                    }}
                  >
                    {iconGlyphs[draft.iconStyle]}
                  </button>
                </div>
                <span className="collection-product-line wide" />
                <span className="collection-product-line" />
                <span className="collection-product-price" />
              </div>
              <p>
                Click the purple wishlist button to preview its active state.
              </p>
            </div>
          </main>
        </fetcher.Form>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
