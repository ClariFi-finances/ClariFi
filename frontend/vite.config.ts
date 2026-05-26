import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm"

import { VitePWA } from 'vite-plugin-pwa'

// Fetch from AWS SSM dynamically before Vite starts
async function fetchSSMParams() {
  const ssmClient = new SSMClient({ region: process.env.AWS_REGION || "sa-east-1" })
  const configParams: Record<string, string> = {}

  try {
    const command = new GetParametersCommand({
      Names: [
        "/clarifi/frontend/cognito_authority",
        "/clarifi/frontend/cognito_client_id",
        "/clarifi/frontend/http_cognito_redirect_uri",
        "/clarifi/frontend/cognito_domain",
      ],
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)
    response.Parameters?.forEach((param) => {
      if (param.Name === "/clarifi/frontend/cognito_authority") configParams['VITE_COGNITO_AUTHORITY'] = param.Value || ""
      if (param.Name === "/clarifi/frontend/cognito_client_id") configParams['VITE_COGNITO_CLIENT_ID'] = param.Value || ""
      if (param.Name === "/clarifi/frontend/http_cognito_redirect_uri") configParams['VITE_HTTP_COGNITO_REDIRECT_URI'] = param.Value || ""
      if (param.Name === "/clarifi/frontend/cognito_domain") configParams['VITE_COGNITO_DOMAIN'] = param.Value || ""
    })
    
    console.log("Successfully loaded Cognito settings from AWS SSM.")
  } catch (error) {
    console.warn("Failed to fetch from parameter store. Falling back to local env variables if they exist in process.env", error)
  }
  
  return configParams
}

// https://vite.dev/config/
export default defineConfig(async () => {
  const ssmParams = await fetchSSMParams()

  return {
    server: {
      allowedHosts: true
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.svg', 'favicon_aws.svg', 'icons.svg'],
        manifest: {
          name: 'ClariFi',
          short_name: 'ClariFi',
          description: 'ClariFi Finances App',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml'
            },
            {
              src: 'favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      global: 'window',
      ...Object.keys(ssmParams).reduce((acc, key) => {
        acc[`import.meta.env.${key}`] = JSON.stringify(ssmParams[key])
        return acc
      }, {} as Record<string, string>)
    }
  }
})
