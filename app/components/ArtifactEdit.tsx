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
import { backup } from "../lib/db"

const emojis = ["🚀", "💡", "🎨", "🧰", "📦", "🧪", "🎵", "🌱", "⭐", "🔥"]

export function ArtifactEdit() {
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0])
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

    db.query(
      "INSERT INTO artifacts (Namespace, HtmlFile, Icon) VALUES ($1, $2, $3)",
      [formData.get("name"), htmlContent, selectedEmoji],
    ).catch((error) => {
      console.error("Error saving artifact:", error)
    }).finally(() => {
      backup(db);
    });
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>New Artifact</FieldLegend>
            <FieldDescription>
              Store your application artifacts securely.
            </FieldDescription>
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
                <Input
                  id="artifact-edit-file"
                  name="file"
                  placeholder="1234 5678 9012 3456"
                  required
                  type="file"
                  accept=".html,text/html"
                />
                <FieldDescription>
                  Your app must be a self-contained HTML file.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="artifact-edit-icon">
                  Icon
                </FieldLabel>
                <Input
                  id="artifact-edit-icon"
                  name="icon"
                  required
                  readOnly
                  value={selectedEmoji}
                />
                <div
                  aria-label="Choose an artifact icon"
                  className="grid grid-cols-5 gap-2 pt-2"
                  role="group"
                >
                  {emojis.map((emoji) => (
                    <Button
                      aria-label={`Choose ${emoji} as the artifact icon`}
                      aria-pressed={selectedEmoji === emoji}
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      size="icon"
                      type="button"
                      variant={selectedEmoji === emoji ? "secondary" : "outline"}
                    >
                      <span aria-hidden="true" className="text-lg">
                        {emoji}
                      </span>
                    </Button>
                  ))}
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
