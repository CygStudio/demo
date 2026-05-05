import { useEffect, useState } from 'react'

export function useImagePreload(srcs, { failOnError = true } = {}) {
  const [state, setState] = useState({ error: null, ready: false })

  useEffect(() => {
    let cancelled = false
    setState({ error: null, ready: false })

    const promises = srcs.map((src) => preloadImage(src, failOnError))

    Promise.all(promises)
      .then(() => {
        if (!cancelled) setState({ error: null, ready: true })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setState({ error, ready: false })
      })

    return () => {
      cancelled = true
    }
  }, [failOnError, srcs])

  return state
}

function preloadImage(src, failOnError) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = () => {
      const error = new Error(`Unable to preload image: ${src}`)
      if (failOnError) reject(error)
      else resolve()
    }
    img.src = src
  })
}
