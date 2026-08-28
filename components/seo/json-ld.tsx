/**
 * Renders a JSON-LD document into the page.
 *
 * Deliberately a plain server component with no "use client": structured data
 * must be present in the static HTML the crawler downloads, not injected after
 * hydration. `data` is stringified with the `<` escaped so a stray angle
 * bracket in copy can never close the script tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
