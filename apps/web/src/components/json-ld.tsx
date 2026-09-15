type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Renders JSON-LD for Google rich results. */
export function JsonLd({ data }: Props) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  );
}
