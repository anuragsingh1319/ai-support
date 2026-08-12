import React from 'react'
import { createRoot } from 'react-dom/client'
import ChatWidget from './ChatWidget'

// Find the script tag to read the data-agent-id attribute
const script = document.currentScript || document.querySelector('script[data-agent-id]')
const agentId = script ? script.getAttribute('data-agent-id') : null

// Create a shadow DOM host element
const host = document.createElement('div')
host.id = 'ai-support-widget-root'
document.body.appendChild(host)

// Mount React app into the host
const root = createRoot(host)
root.render(<ChatWidget agentId={agentId} apiBase={window.AI_SUPPORT_API_URL || 'http://localhost:8000/api/v1'} />)
