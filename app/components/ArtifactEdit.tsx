"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useGateway } from "./ClientDatabaseGateway"
import { scheduleBackup } from "../lib/db"
import {
  insertArtifact,
  isDuplicateNamespaceError,
  updateArtifact,
} from "../lib/artifacts"
import type { Artifact } from "../lib/types"
import type { ArtifactTemplate } from "../lib/registry-types"
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { IconPicker } from "./IconPicker"
import { FileUpload, isFileOversized } from "./file-upload"
import { LiveStatus } from "./LiveStatus"
import { useRovingRadio } from "../lib/use-roving-radio"
import { FeatureCard, featureCardVariantNames } from "./feature-card"
import { cn } from "@/lib/utils"
import { BrandTag } from "./brand"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppIcon, appIconVariantNames } from "./app-icon"
import {
  IconAlertHexagon,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconPackageImport,
  IconPlus,
} from "@tabler/icons-react"

const PRESET_COLORS = [
  { value: "#ff5003", name: "Orange" },
  { value: "#ffd23f", name: "Yellow" },
  { value: "#b8dfe0", name: "Light blue" },
  { value: "#c4f07a", name: "Lime green" },
  { value: "#f4a7c0", name: "Pink" },
  { value: "#7aa2ff", name: "Periwinkle blue" },
  { value: "#004b2c", name: "Dark green" },
  { value: "#171717", name: "Near black" },
]

const NAME_ID = "artifact-edit-name"
const NAME_DESC_ID = "artifact-edit-name-desc"
const NAME_ERROR_ID = "artifact-edit-name-error"
const FILE_ID = "artifact-edit-file"
const FILE_DESC_ID = "artifact-edit-file-desc"
const FILE_ERROR_ID = "artifact-edit-file-error"

function PlaceholderTile() {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <div className="size-[60px] rounded-[28%] bg-slate-800" />
      <div className="h-1.5 w-9 rounded-full bg-slate-800" />
    </div>
  )
}

/**
 * Create/edit form for an app, or a copy of a registry template. State is
 * initialised from `artifact` or `template` once, so the parent should pass
 * `key={artifact?.namespace ?? template?.name ?? 'new'}` to reset it when the
 * target changes.
 */
export function ArtifactEdit(
  { artifact, template, onSaved }: { artifact?: Artifact; template?: ArtifactTemplate; onSaved?: () => void } = {},
) {
  const isEdit = !!artifact
  const isTemplate = !artifact && !!template
  const [name, setName] = useState(artifact?.namespace ?? template?.name ?? "")
  const [description, setDescription] = useState(artifact?.description ?? template?.description ?? "")
  const [selectedIcon, setSelectedIcon] = useState(artifact?.icon || template?.icon || "IconRocket")
  const [selectedVariant, setSelectedVariant] = useState(String(artifact?.variant ?? template?.variant ?? 1))
  const [mobileVariant, setMobileVariant] = useState(artifact?.mobile_variant ?? template?.mobile_variant ?? 1)
  const [previewTab, setPreviewTab] = useState("desktop")
  const [selectedColor, setSelectedColor] = useState(artifact?.color || template?.color || "#ff5003")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const { db } = useGateway()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Radix focuses the first field on open and scrolls it into view, which
  // starts the dialog scrolled down. Focus the scroll box itself first (without
  // scrolling) so Radix sees focus already inside the dialog and leaves it be.
  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true })
    scrollRef.current?.scrollTo({ top: 0 })
    // Re-assert next frame: on a cold first open the closing dropdown can still
    // steal focus after mount.
    const raf = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // aria-disabled (not disabled) keeps focus on the button, so guard here.
    if (saving) return
    const nextNameError = !isEdit && !name.trim() ? "Enter an app name" : null
    const nextFileError = !isEdit && !isTemplate && !file ? "Choose an HTML file" : null
    setNameError(nextNameError)
    setFileError(nextFileError)
    if (nextNameError || nextFileError || isFileOversized(file)) {
      setError(null)
      document.getElementById(nextNameError ? NAME_ID : FILE_ID)?.focus()
      return
    }
    if (!db) {
      setError("Database is not ready yet")
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const html = template ? template.htmlfile : file ? await file.text() : undefined
      const theme = {
        icon: selectedIcon,
        variant: Number(selectedVariant),
        mobile_variant: mobileVariant,
        color: selectedColor,
        description: description.trim(),
      }
      if (artifact) {
        await updateArtifact(db, artifact.namespace, theme, html)
      } else {
        await insertArtifact(db, { namespace: name.trim(), htmlfile: html ?? "", ...theme })
      }
      scheduleBackup(db)
      setSaved(true)
      onSaved?.()
    } catch (err) {
      console.error("Error saving artifact:", err)
      if (isDuplicateNamespaceError(err)) {
        setNameError("An app with that name already exists")
        document.getElementById(NAME_ID)?.focus()
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong while saving")
      }
    } finally {
      setSaving(false)
    }
  }

  const swatchIndex = PRESET_COLORS.findIndex((c) => c.value === selectedColor.toLowerCase())
  const swatches = useRovingRadio({
    count: PRESET_COLORS.length,
    selectedIndex: swatchIndex,
    onSelect: (i) => setSelectedColor(PRESET_COLORS[i].value),
  })
  const desktopStyles = useRovingRadio({
    count: featureCardVariantNames.length,
    selectedIndex: Number(selectedVariant) - 1,
    onSelect: (i) => setSelectedVariant(String(i + 1)),
    columns: 3,
  })
  const mobileStyles = useRovingRadio({
    count: appIconVariantNames.length,
    selectedIndex: mobileVariant - 1,
    onSelect: (i) => setMobileVariant(i + 1),
    columns: 3,
  })

  const title = artifact
    ? `Edit ${artifact.namespace}`
    : isTemplate
      ? "Add to my apps"
      : "Add an app"

  return (
  <div
    ref={scrollRef}
    tabIndex={-1}
    className="flex max-h-[85dvh] w-full flex-col overflow-y-auto rounded-xl p-4 outline-none md:max-h-[92dvh]"
  >
    <BrandTag className="mb-3 self-start md:mb-2">
      {isEdit ? "Editing" : isTemplate ? "From registry" : "New app"}
    </BrandTag>
    <DialogTitle className="text-xl">{title}</DialogTitle>
    <DialogDescription className="mt-1">
      {isTemplate
        ? "Name it and style it however you like. You can edit these later."
        : "Store your application artifacts securely."}
    </DialogDescription>
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-4 flex flex-col gap-4 md:mt-3 md:grid md:grid-cols-2 md:items-start md:gap-6"
    >
      <FieldGroup className="max-md:contents md:flex md:flex-col md:gap-3">
        <Field>
          <FieldLabel htmlFor={NAME_ID}>
            App Name
            {!isEdit && (
              <span className="text-xs font-normal text-muted-foreground">(required)</span>
            )}
          </FieldLabel>
          <Input
            id={NAME_ID}
            name="name"
            placeholder="Evil Rabbit"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (nameError) setNameError(null)
            }}
            disabled={isEdit}
            required
            aria-invalid={nameError ? true : undefined}
            aria-describedby={
              [isEdit ? NAME_DESC_ID : null, nameError ? NAME_ERROR_ID : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {isEdit && (
            <FieldDescription id={NAME_DESC_ID}>
              Name is the app&apos;s storage namespace and can&apos;t be changed
            </FieldDescription>
          )}
          {nameError && (
            <FieldError id={NAME_ERROR_ID} className="text-red-400">
              {nameError}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="artifact-edit-description">
            Description
          </FieldLabel>
          <Textarea
            id="artifact-edit-description"
            name="description"
            placeholder="What does this app do?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        {isTemplate ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <IconPackageImport size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              This app is copied from the registry. Your copy is stored on this device, and keeps working even if the registry changes.
            </span>
          </div>
        ) : (
        <Field>
          <FileUpload
            label={isEdit ? "Replace HTML file (optional)" : "App File"}
            name="file"
            required={!isEdit}
            id={FILE_ID}
            invalid={!!fileError}
            describedBy={[FILE_DESC_ID, fileError ? FILE_ERROR_ID : null].filter(Boolean).join(" ")}
            accept={[".html", "text/html"]}
            onFileChange={(next) => {
              setFile(next)
              if (fileError) setFileError(null)
            }}
          />
          <FieldDescription id={FILE_DESC_ID}>
            Your app must be a self-contained HTML file which has no external dependencies.{" "}
            <span className="text-xs">(no external CSS or JavaScript files)</span>
          </FieldDescription>
          {fileError && (
            <FieldError id={FILE_ERROR_ID} className="text-red-400">
              {fileError}
            </FieldError>
          )}
        </Field>
        )}
        <Field>
          <FieldLabel htmlFor="artifact-edit-icon">Icon</FieldLabel>
          <IconPicker
            id="artifact-edit-icon"
            value={selectedIcon}
            onChange={setSelectedIcon}
          />
        </Field>
      </FieldGroup>
      <FieldGroup className="max-md:contents md:flex md:flex-col md:gap-3">
        <Tabs value={previewTab} onValueChange={setPreviewTab} className="my-4 items-center max-md:order-first md:my-0">
          <TabsList>
            <TabsTrigger value="desktop">
              <IconDeviceDesktop aria-hidden="true" /> Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <IconDeviceMobile aria-hidden="true" /> Mobile
            </TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="w-full">
            <p className="sr-only">Preview of the card as it will appear</p>
            <div aria-hidden="true" className="mx-auto w-full max-w-xs md:h-[136px] md:overflow-hidden">
              <FeatureCard
                preview
                title={name.trim() || "Your app"}
                description={description}
                icon={selectedIcon}
                variant={Number(selectedVariant)}
                color={selectedColor}
                className="md:origin-top md:scale-[0.52]"
              />
            </div>
          </TabsContent>
          <TabsContent value="mobile" className="w-full">
            <p className="sr-only">Preview of the icon as it will appear</p>
            <div aria-hidden="true" className="mx-auto w-full max-w-[220px] md:h-[136px] md:max-w-none md:overflow-hidden">
            <div className="mx-auto w-full max-w-[220px] rounded-[28px] border border-slate-700 bg-black p-4 shadow-[0_0_40px_rgba(37,99,235,.25)] md:origin-top md:scale-[0.68]">
              <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                {[0, 1].map((i) => (
                  <PlaceholderTile key={i} />
                ))}
                <AppIcon
                  size="md"
                  showLabel
                  title={name.trim() || "My app"}
                  icon={selectedIcon}
                  color={selectedColor}
                  variant={mobileVariant}
                />
                {[2, 3, 4].map((i) => (
                  <PlaceholderTile key={i} />
                ))}
              </div>
            </div>
            </div>
          </TabsContent>
        </Tabs>
        <Field>
          <FieldLabel id="artifact-edit-color-label">Colour</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-labelledby="artifact-edit-color-label"
              className="flex flex-wrap items-center gap-2"
              {...swatches.groupProps}
            >
              {PRESET_COLORS.map((preset, index) => (
                <button
                  key={preset.value}
                  type="button"
                  aria-label={preset.name}
                  {...swatches.getItemProps(index)}
                  onClick={() => setSelectedColor(preset.value)}
                  style={{ backgroundColor: preset.value }}
                  className={cn(
                    "size-8 rounded-full border border-black/20 ring-1 ring-white/40 outline-none focus-visible:ring-3 focus-visible:ring-ring",
                    index === swatchIndex &&
                      "ring-2 ring-blue-500 ring-offset-2 ring-offset-background",
                  )}
                />
              ))}
            </div>
            <Input
              id="artifact-edit-color"
              type="color"
              aria-label="Custom colour"
              className="h-8 w-12 p-1"
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value)}
            />
          </div>
        </Field>
        <Field>
          <FieldLabel id="artifact-edit-variant-label">Desktop card style</FieldLabel>
          <div
            role="radiogroup"
            aria-labelledby="artifact-edit-variant-label"
            className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-1.5"
            {...desktopStyles.groupProps}
          >
            {featureCardVariantNames.map((variantName, index) => {
              const n = index + 1
              const checked = Number(selectedVariant) === n
              return (
                <button
                  key={variantName}
                  type="button"
                  aria-label={`${n}. ${variantName}`}
                  {...desktopStyles.getItemProps(index)}
                  onClick={() => setSelectedVariant(String(n))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-xs capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring md:p-0.5",
                    checked ? "bg-blue-500/15 ring-2 ring-blue-500" : "hover:bg-muted",
                  )}
                >
                  <span className="flex w-full justify-center rounded-lg bg-slate-900 p-2 md:p-0.5">
                    <span className="relative h-[92px] w-full overflow-hidden rounded-md md:h-[68px]">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2 scale-[0.25] md:scale-[0.2]"
                      >
                        <FeatureCard
                          preview
                          title={name.trim() || "Your app"}
                          description={description}
                          icon={selectedIcon}
                          variant={n}
                          color={selectedColor}
                        />
                      </span>
                    </span>
                  </span>
                  {variantName}
                </button>
              )
            })}
          </div>
        </Field>
        <Field>
          <FieldLabel id="artifact-edit-mobile-label">Mobile icon style</FieldLabel>
          <div
            role="radiogroup"
            aria-labelledby="artifact-edit-mobile-label"
            className="grid grid-cols-3 gap-2 min-[940px]:grid-cols-6 min-[940px]:gap-1"
            {...mobileStyles.groupProps}
          >
            {appIconVariantNames.map((variantName, index) => {
              const n = index + 1
              const checked = mobileVariant === n
              return (
                <button
                  key={variantName}
                  type="button"
                  aria-label={`${n}. ${variantName}`}
                  {...mobileStyles.getItemProps(index)}
                  onClick={() => setMobileVariant(n)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-xs capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring min-[940px]:p-0.5",
                    checked ? "bg-blue-500/15 ring-2 ring-blue-500" : "hover:bg-muted",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex w-full justify-center rounded-lg bg-black p-2 min-[940px]:p-0"
                  >
                    <AppIcon
                      size="sm"
                      variant={n}
                      icon={selectedIcon}
                      color={selectedColor}
                      title={name.trim() || "My app"}
                    />
                  </span>
                  {variantName}
                </button>
              )
            })}
          </div>
        </Field>
      </FieldGroup>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-red-900 bg-red-950 px-4 py-3 text-xs text-red-400 md:col-span-2"
        >
          <IconAlertHexagon size={16} aria-hidden="true" className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="sticky -bottom-4 [@media(max-height:500px)]:static -mx-4 flex flex-col gap-2 border-t bg-popover px-4 pt-3 pb-4 md:col-span-2 md:flex-row md:gap-3">
        <Button
          type="submit"
          aria-disabled={saving || undefined}
          aria-busy={saving || undefined}
          className="w-full rounded-md bg-blue-600 p-5 text-white hover:bg-blue-700 aria-disabled:opacity-70 md:h-11 md:flex-1 md:p-0"
        >
          {saving ? (
            <Spinner />
          ) : isEdit ? (
            <IconDeviceFloppy size={16} aria-hidden="true" />
          ) : (
            <IconPlus size={16} aria-hidden="true" />
          )}
          {saving
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : isTemplate
                ? "Add to my apps"
                : "Add app"}
        </Button>
        <LiveStatus message={saving ? "Saving app" : saved ? "App saved" : ""} />
        <DialogClose asChild>
          <Button variant="ghost" type="button" className="w-full p-5 md:h-11 md:flex-1 md:p-0">
            Cancel
          </Button>
        </DialogClose>
      </div>
    </form>
  </div>
  )
}
