'use client'

import { useEffect } from 'react'
import type { Language } from '@/lib/types'
import { translatePhrase } from '@/lib/i18n'

const TRANSLATED_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt']
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA'])

interface Props {
  language: Language
}

function translateNode(node: Node, language: Language) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement
    if (!parent || SKIPPED_TAGS.has(parent.tagName)) return
    const next = translatePhrase(node.textContent || '', language)
    if (next !== node.textContent) node.textContent = next
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const element = node as Element
  if (SKIPPED_TAGS.has(element.tagName) || element.closest('[data-no-translate]')) return

  TRANSLATED_ATTRIBUTES.forEach((attribute) => {
    const current = element.getAttribute(attribute)
    if (!current) return
    const next = translatePhrase(current, language)
    if (next !== current) element.setAttribute(attribute, next)
  })

  element.childNodes.forEach((child) => translateNode(child, language))
}

export default function GlobalTranslator({ language }: Props) {
  useEffect(() => {
    document.documentElement.lang = language

    const applyTranslations = () => translateNode(document.body, language)
    applyTranslations()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => translateNode(node, language))
        if (mutation.type === 'characterData') translateNode(mutation.target, language)
        if (mutation.type === 'attributes') translateNode(mutation.target, language)
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATED_ATTRIBUTES,
    })

    return () => observer.disconnect()
  }, [language])

  return null
}
