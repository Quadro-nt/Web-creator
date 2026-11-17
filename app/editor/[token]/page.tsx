import { notFound } from 'next/navigation'

type Props = {
  params: { token: string }
}

export default function EditorPage({ params }: Props) {
  if (!params.token) {
    notFound()
  }

  return (
    <main>
      <h1>Editor</h1>
      <p>Token: {params.token}</p>
    </main>
  )
}
