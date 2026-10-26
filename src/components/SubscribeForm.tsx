import { useState, type SubmitEvent } from "react"
import { actions, isInputError } from "astro:actions"
import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

interface SubscribeFormProps {
  email: string
  privacy: string
  games: { slug: string; title: string }[]
}

type FieldErrors = Partial<Record<"email" | "games" | "consent", string[]>>

export function SubscribeForm({ email, privacy, games }: SubscribeFormProps) {
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [failed, setFailed] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setFailed(false)
    setFieldErrors({})

    const { data, error } = await actions.subscribe(
      new FormData(event.currentTarget)
    )

    setPending(false)
    if (data) setSentTo(data.email)
    else if (isInputError(error)) setFieldErrors(error.fields)
    else setFailed(true)
  }

  if (sentTo !== null) {
    return (
      <div
        role="status"
        className="flex flex-col justify-center gap-2 rounded-xl bg-success p-10 text-success-foreground"
      >
        <strong className="font-display text-2xl font-medium">
          ¡Revisa tu correo!
        </strong>
        <span className="leading-6">
          Te enviamos un enlace a {sentTo}. Confírmalo y te avisaremos cuando
          haya versiones nuevas.
        </span>
      </div>
    )
  }

  const checkbox = "size-5 shrink-0 accent-primary"

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl bg-paper p-6 shadow-paper md:p-10"
    >
      <FieldGroup className="gap-5">
        {failed && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>No pudimos guardar tu inscripción</AlertTitle>
            <AlertDescription>
              Inténtalo de nuevo en unos minutos o escríbenos a{" "}
              <a href={`mailto:${email}`}>{email}</a>.
            </AlertDescription>
          </Alert>
        )}
        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="subscribe-email">Correo</FieldLabel>
          <Input
            id="subscribe-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.cl"
            aria-invalid={!!fieldErrors.email}
          />
          <FieldError>{fieldErrors.email?.[0]}</FieldError>
        </Field>
        <FieldSet data-invalid={!!fieldErrors.games}>
          <FieldLegend variant="label">¿De qué juegos?</FieldLegend>
          <div className="flex flex-col gap-3">
            {games.map((game) => (
              <label
                key={game.slug}
                className="flex items-center gap-3 text-[15px]"
              >
                <input
                  type="checkbox"
                  name="games"
                  value={game.slug}
                  defaultChecked
                  className={checkbox}
                />
                {game.title}
              </label>
            ))}
          </div>
          <FieldError>{fieldErrors.games?.[0]}</FieldError>
        </FieldSet>
        <Field data-invalid={!!fieldErrors.consent}>
          <label className="flex items-start gap-3 text-[15px] leading-6 text-body">
            <input
              type="checkbox"
              name="consent"
              required
              className={`${checkbox} mt-0.5`}
              aria-invalid={!!fieldErrors.consent}
            />
            <span>
              Acepto que Ninety Nine One me escriba sobre estos juegos. Puedo
              darme de baja en un clic. Más en{" "}
              <a href={privacy} target="_blank" rel="noopener">
                privacidad
              </a>
              .
            </span>
          </label>
          <FieldError>{fieldErrors.consent?.[0]}</FieldError>
        </Field>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />
        <Button
          type="submit"
          variant="ink"
          size="lg"
          disabled={pending}
          className="self-start"
        >
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Enviando…" : "Avísame"}
        </Button>
      </FieldGroup>
    </form>
  )
}
