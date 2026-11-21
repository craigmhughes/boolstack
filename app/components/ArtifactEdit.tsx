"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
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
import { FileUpload } from "./file-upload"
import { FeatureCard, featureCardVariantNames } from "./feature-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  "#ff5003",
  "#ffd23f",
  "#b8dfe0",
  "#c4f07a",
  "#f4a7c0",
  "#7aa2ff",
  "#004b2c",
  "#171717",
]

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
  const { db } = useGateway()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Radix focuses the first field on open and scrolls it into view, which
  // starts the dialog scrolled down. Focus the scroll box itself first (without
  // scrolling) so Radix sees focus already inside the dialog and leaves it be.
  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true })
    scrollRef.current?.scrollTo({ top: 0 })
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!db) {
      setError("Database is not ready yet")
      return
    }
    if (!isEdit && !isTemplate && !file) {
      setError("Choose an HTML file")
      return
    }

    setSaving(true)
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
      onSaved?.()
    } catch (err) {
      console.error("Error saving artifact:", err)
      setError(
        isDuplicateNamespaceError(err)
          ? "An app with that name already exists"
          : err instanceof Error
            ? err.message
            : "Something went wrong while saving",
      )
    } finally {
      setSaving(false)
    }
  }

  const title = artifact
    ? `Edit ${artifact.namespace}`
    : isTemplate
      ? "Add to my apps"
      : "Add an app"

  return (
  <div
    ref={scrollRef}
    tabIndex={-1}
    className="flex max-h-[85dvh] w-full flex-col overflow-y-auto rounded-xl p-4 outline-none"
  >
    <BrandTag className="mb-3 self-start">
      {isEdit ? "Editing" : isTemplate ? "From registry" : "New app"}
    </BrandTag>
    <DialogTitle className="text-xl">{title}</DialogTitle>
    <DialogDescription className="mt-1">
      {isTemplate
        ? "Name it and style it however you like. You can edit these later."
        : "Store your application artifacts securely."}
    </DialogDescription>
    <Tabs value={previewTab} onValueChange={setPreviewTab} className="my-4 items-center">
      <TabsList>
        <TabsTrigger value="desktop">
          <IconDeviceDesktop /> Desktop
        </TabsTrigger>
        <TabsTrigger value="mobile">
          <IconDeviceMobile /> Mobile
        </TabsTrigger>
      </TabsList>
      <TabsContent value="desktop" className="w-full">
        <div className="mx-auto w-full max-w-xs">
          <FeatureCard
            preview
            title={name.trim() || "Your app"}
            description={description}
            icon={selectedIcon}
            variant={Number(selectedVariant)}
            color={selectedColor}
          />
        </div>
      </TabsContent>
      <TabsContent value="mobile" className="w-full">
        <div className="mx-auto w-full max-w-[220px] rounded-[28px] border border-slate-700 bg-black p-4 shadow-[0_0_40px_rgba(37,99,235,.25)]">
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
      </TabsContent>
    </Tabs>
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="artifact-edit-name">App Name</FieldLabel>
              <Input
                id="artifact-edit-name"
                name="name"
                placeholder="Evil Rabbit"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isEdit}
                required
              />
              {isEdit && (
                <FieldDescription>
                  Name is the app&apos;s storage namespace and can&apos;t be changed
                </FieldDescription>
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
                <IconPackageImport size={16} className="mt-0.5 shrink-0" />
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
                accept={[".html", "text/html"]}
                onFileChange={setFile}
              />
              <FieldDescription>
                Your app must be a self-contained HTML file which has no external dependencies.
                <span className="text-xs whitespace-nowrap mt-12">(no external CSS or JavaScript files)</span>
              </FieldDescription>
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
            <Field>
              <FieldLabel htmlFor="artifact-edit-variant">Desktop card style</FieldLabel>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger id="artifact-edit-variant" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {featureCardVariantNames.map((variantName, index) => (
                    <SelectItem key={variantName} value={String(index + 1)}>
                      {index + 1}. {variantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="artifact-edit-color">Colour</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-label={`Use colour ${preset}`}
                    aria-pressed={selectedColor.toLowerCase() === preset}
                    onClick={() => setSelectedColor(preset)}
                    style={{ backgroundColor: preset }}
                    className={cn(
                      "size-8 rounded-full border border-black/20 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      selectedColor.toLowerCase() === preset &&
                        "ring-2 ring-blue-500 ring-offset-2 ring-offset-background",
                    )}
                  />
                ))}
                <Input
                  id="artifact-edit-color"
                  type="color"
                  className="h-8 w-12 p-1"
                  value={selectedColor}
                  onChange={(event) => setSelectedColor(event.target.value)}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel id="artifact-edit-mobile-label">Mobile icon style</FieldLabel>
              <div
                role="radiogroup"
                aria-labelledby="artifact-edit-mobile-label"
                className="grid grid-cols-3 gap-2"
              >
                {appIconVariantNames.map((variantName, index) => {
                  const n = index + 1
                  const checked = mobileVariant === n
                  return (
                    <button
                      key={variantName}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => {
                        setMobileVariant(n)
                        setPreviewTab("mobile")
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-[11px] capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        checked ? "bg-blue-500/15 ring-2 ring-blue-500" : "hover:bg-muted",
                      )}
                    >
                      <span className="flex w-full justify-center rounded-lg bg-black p-2">
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
        </FieldSet>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-red-900 bg-red-950 px-4 py-3 text-[11px] text-red-400"
          >
            <IconAlertHexagon size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="sticky -bottom-4 -mx-4 flex flex-col gap-2 border-t bg-popover px-4 pt-3 pb-4">
          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-blue-500 p-5 text-white hover:bg-blue-600"
          >
            {saving ? <Spinner /> : isEdit ? <IconDeviceFloppy size={16} /> : <IconPlus size={16} />}
            {isEdit ? "Save changes" : isTemplate ? "Add to my apps" : "Add app"}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" type="button" className="w-full p-5">
              Cancel
            </Button>
          </DialogClose>
        </div>
      </FieldGroup>
    </form>
  </div>
  )
}
