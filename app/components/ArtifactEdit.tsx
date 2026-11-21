"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useGateway } from "./ClientDatabaseGateway"
import { scheduleBackup } from "../lib/db"
import { insertArtifact } from "../lib/artifacts"
import type { Artifact } from "../lib/types"
import { FileUploadFieldInput } from "./opensourceui/FileUpload"
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { IconPicker } from "./IconPicker"
import { FileUpload } from "./file-upload"
import { featureCardVariantNames } from "./feature-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ArtifactEdit(
  { artifact, onSaved }: { artifact?: Artifact; onSaved?: () => void } = {},
) {
  const [selectedIcon, setSelectedIcon] = useState("IconRocket")
  const [selectedVariant, setSelectedVariant] = useState("1")
  const [selectedColor, setSelectedColor] = useState("#ff5003")
  const { db } = useGateway()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!db) {
      console.error("Database is not initialized")
      return
    }

    const formData = new FormData(event.currentTarget)
    const file = formData.get("file")
    const htmlContent = file instanceof File ? await file.text() : ""

    try {
      await insertArtifact(db, {
        namespace: String(formData.get("name") ?? ""),
        htmlfile: htmlContent,
        icon: selectedIcon,
        variant: Number(selectedVariant),
        color: selectedColor,
        description: artifact?.description ?? "",
      })
      scheduleBackup(db)
      onSaved?.()
    } catch (error) {
      console.error("Error saving artifact:", error)
    }
  }

  return (
    <div className="w-full p-4 flex flex-col">
      <DialogTitle>New Artifact</DialogTitle>
      <DialogDescription>
        Store your application artifacts securely.
      </DialogDescription>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="artifact-edit-name">
                  App Name
                </FieldLabel>
                <Input
                  id="artifact-edit-name"
                  name="name"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="artifact-edit-file">
                  App File
                </FieldLabel>
                <FileUpload
                  label="Upload HTML file"
                  accept={[".html", "text/html"]}
                />
                <FieldDescription>
                  Your app must be a self-contained HTML file which has no external dependencies. 
                  <span className="text-xs whitespace-nowrap mt-12">(no external CSS or JavaScript files)</span>
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="artifact-edit-icon">
                  Icon
                </FieldLabel>
                <IconPicker
                  id="artifact-edit-icon"
                  value={selectedIcon}
                  onChange={setSelectedIcon}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="artifact-edit-variant">
                  Style
                </FieldLabel>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger id="artifact-edit-variant" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {featureCardVariantNames.map((name, index) => (
                      <SelectItem key={name} value={String(index + 1)}>
                        {index + 1}. {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="artifact-edit-color">
                  Colour
                </FieldLabel>
                <Input
                  id="artifact-edit-color"
                  type="color"
                  value={selectedColor}
                  onChange={(event) => setSelectedColor(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
