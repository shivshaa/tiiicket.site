import QRCode from "qrcode"

// IPFS Gateway URL
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

// Function to get IPFS Gateway URL from IPFS hash
export const getIPFSGatewayURL = (ipfsHash: string): string => {
  // If the hash already includes the full ipfs:// protocol, extract just the hash
  if (ipfsHash.startsWith("ipfs://")) {
    ipfsHash = ipfsHash.replace("ipfs://", "")
  }
  return `${IPFS_GATEWAY}${ipfsHash}`
}

// Function to upload file to IPFS using server-side API
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append("type", "file")
    formData.append("file", file)

    // Use our server-side API
    const response = await fetch("/api/ipfs", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error uploading to IPFS: ${errorData.error}`)
    }

    const data = await response.json()
    return data.ipfsHash
  } catch (error) {
    console.error("Error uploading to IPFS:", error)
    throw error
  }
}

// Function to upload JSON metadata to IPFS using server-side API
export const uploadJSONToIPFS = async (metadata: any): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append("type", "json")
    formData.append("json", JSON.stringify(metadata))

    // Use our server-side API
    const response = await fetch("/api/ipfs", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error uploading JSON to IPFS: ${errorData.error}`)
    }

    const data = await response.json()
    return data.ipfsHash
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error)
    throw error
  }
}

// Function to create event metadata and upload to IPFS
export const createEventMetadata = async (
  eventData: {
    name: string
    description: string
    date: number
    location: string
    ticketPrice: string
    maxTickets: number
  },
  imageFile: File,
): Promise<{ metadataURI: string; imageURI: string }> => {
  try {
    // Upload image to IPFS
    const imageHash = await uploadToIPFS(imageFile)
    const imageURI = `ipfs://${imageHash}`

    // Create metadata
    const metadata = {
      name: eventData.name,
      description: eventData.description,
      image: imageURI,
      attributes: [
        {
          trait_type: "Date",
          value: new Date(eventData.date * 1000).toISOString(),
        },
        {
          trait_type: "Location",
          value: eventData.location,
        },
        {
          trait_type: "Ticket Price",
          value: `${eventData.ticketPrice} ETH`,
        },
        {
          trait_type: "Maximum Tickets",
          value: eventData.maxTickets,
        },
      ],
    }

    // Upload metadata to IPFS
    const metadataHash = await uploadJSONToIPFS(metadata)
    const metadataURI = `ipfs://${metadataHash}`

    return { metadataURI, imageURI }
  } catch (error) {
    console.error("Error creating event metadata:", error)
    throw error
  }
}

export const createTicketMetadata = async (
  ticketData: {
    eventName: string
    eventId: number
    seatInfo: string
    ticketCategory: string
  },
  supabase: any, // Pass Supabase client instance
): Promise<{ metadataURI: string; imageURI: string }> => {
  try {
    // 1️⃣ Fetch Event Image from Supabase
    const { data: event, error } = await supabase
      .from("event_data")
      .select("event_image_url")
      .eq("id", ticketData.eventId)
      .single()

    if (error || !event) {
      throw new Error("Event image not found in database")
    }

    const imageURI = event.event_image_url
    console.log("Fetched Event Image:", imageURI)

    // 2️⃣ Generate QR Code as Base64
    const qrDataURL = await QRCode.toDataURL(`Event: ${ticketData.eventName}, Seat: ${ticketData.seatInfo}`)
    console.log("Generated QR Code:", qrDataURL)

    // 3️⃣ Create Metadata
    const metadata = {
      name: `Ticket for ${ticketData.eventName}`,
      description: `NFT Ticket for event #${ticketData.eventId}`,
      image: imageURI, // Use event image
      qr_code_base64: qrDataURL, // Store QR as Base64
      attributes: [
        { trait_type: "Event ID", value: ticketData.eventId },
        { trait_type: "Seat Info", value: ticketData.seatInfo },
        { trait_type: "Ticket Category", value: ticketData.ticketCategory },
      ],
    }

    // 4️⃣ Upload Metadata to IPFS
    const metadataHash = await uploadJSONToIPFS(metadata)
    const metadataURI = `ipfs://${metadataHash}`
    console.log("Uploaded Metadata URI:", metadataURI)

    return { metadataURI, imageURI }
  } catch (error) {
    console.error("Error creating ticket metadata:", error)
    throw error
  }
}
