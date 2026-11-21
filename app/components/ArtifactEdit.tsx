"use client"

import { useState } from "react"

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
import { IconAlertHexagon, IconDeviceFloppy, IconPlus } from "@tabler/icons-react"

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

/**
 * Create/edit form for an app. State is initialised from `artifact` once, so the
 * parent should pass `key={artifact?.namespace ?? 'new'}` to reset it when the
 * target changes.
 */
export function ArtifactEdit(
  { artifact, onSaved }: { artifact?: Artifact; onSaved?: () => void } = {},
) {
  const isEdit = !!artifact
  const [name, setName] = useState(artifact?.namespace ?? "")
  const [description, setDescription] = useState(artifact?.description ?? "")
  const [selectedIcon, setSelectedIcon] = useState(artifact?.icon || "IconRocket")
  const [selectedVariant, setSelectedVariant] = useState(String(artifact?.variant ?? 1))
  const [selectedColor, setSelectedColor] = useState(artifact?.color || "#ff5003")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { db } = useGateway()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!db) {
      setError("Database is not ready yet")
      return
    }
    if (!isEdit && !file) {
      setError("Choose an HTML file")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const html = file ? await file.text() : undefined
      const theme = {
        icon: selectedIcon,
        variant: Number(selectedVariant),
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

  const title = artifact ? `Edit ${artifact.namespace}` : "Add an app"

  return (
    <div className="relative w-full">
    <BrandTag className="absolute -top-3 left-0 z-10">{isEdit ? "Editing" : "New app"}</BrandTag>
    <div className="flex max-h-[85dvh] w-full flex-col overflow-y-auto rounded-xl p-4 pt-8">
      <DialogTitle className="text-xl">{title}</DialogTitle>
      <DialogDescription className="mt-1">
        Store your application artifacts securely.
      </DialogDescription>
      <div className="mx-auto my-4 w-full max-w-xs">
        <FeatureCard
          preview
          title={name.trim() || "Your app"}
          description={description}
          icon={selectedIcon}
          variant={Number(selectedVariant)}
          color={selectedColor}
        />
      </div>
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
              <Field>
                <FieldLabel htmlFor="artifact-edit-icon">Icon</FieldLabel>
                <IconPicker
                  id="artifact-edit-icon"
                  value={selectedIcon}
                  onChange={setSelectedIcon}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="artifact-edit-variant">Style</FieldLabel>
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
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-blue-500 p-5 text-white hover:bg-blue-600"
            >
              {saving ? <Spinner /> : isEdit ? <IconDeviceFloppy size={16} /> : <IconPlus size={16} />}
              {isEdit ? "Save changes" : "Add app"}
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
    </div>
  )
}
