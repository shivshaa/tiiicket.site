import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Function to upload file to IPFS using Pinata
async function uploadToIPFS(file: Buffer, fileName: string): Promise<string> {
  try {
    // Create form data
    const formData = new FormData()
    const blob = new Blob([file], { type: "application/octet-stream" })
    formData.append("file", blob, fileName)

    // Set up the API key and secret
    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretApiKey = process.env.PINATA_SECRET_KEY

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error("Pinata API keys not found")
    }

    // Upload to Pinata
    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })

    // Return the IPFS hash
    return response.data.IpfsHash
  } catch (error) {
    console.error("Error uploading to IPFS:", error)
    throw error
  }
}

// Function to upload JSON metadata to IPFS
async function uploadJSONToIPFS(metadata: any): Promise<string> {
  try {
    // Set up the API key and secret
    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretApiKey = process.env.PINATA_SECRET_KEY

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error("Pinata API keys not found")
    }

    // Upload to Pinata
    const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })

    // Return the IPFS hash
    return response.data.IpfsHash
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const type = formData.get("type") as string

    if (type === "file") {
      const file = formData.get("file") as File
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const ipfsHash = await uploadToIPFS(buffer, file.name)

      return NextResponse.json({ ipfsHash })
    } else if (type === "json") {
      const jsonData = formData.get("json") as string
      if (!jsonData) {
        return NextResponse.json({ error: "No JSON data provided" }, { status: 400 })
      }

      const metadata = JSON.parse(jsonData)
      const ipfsHash = await uploadJSONToIPFS(metadata)

      return NextResponse.json({ ipfsHash })
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
