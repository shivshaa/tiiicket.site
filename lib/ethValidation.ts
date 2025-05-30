export interface EthValidationResult {
  isValid: boolean
  error?: string
  value?: number
}

export const validateEthAmount = (input: string): EthValidationResult => {
  // Remove any whitespace
  const value = input.trim()

  if (!value) {
    return {
      isValid: false,
      error: "Please enter an amount",
    }
  }

  // Check for valid ETH format (up to 18 decimal places)
  const ethRegex = /^\d*\.?\d{0,18}$/
  if (!ethRegex.test(value)) {
    return {
      isValid: false,
      error: "Invalid format. Use numbers and up to 18 decimal places",
    }
  }

  const numValue = Number.parseFloat(value)

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: "Please enter a valid number",
    }
  }

  if (numValue <= 0) {
    return {
      isValid: false,
      error: "Amount must be greater than 0",
    }
  }

  if (numValue > 1000) {
    return {
      isValid: false,
      error: "Amount cannot exceed 1000 ETH",
    }
  }

  // Check for reasonable minimum (0.001 ETH)
  if (numValue < 0.001) {
    return {
      isValid: false,
      error: "Minimum amount is 0.001 ETH",
    }
  }

  return {
    isValid: true,
    value: numValue,
  }
}

export const formatEthAmount = (amount: number): string => {
  // Format ETH amount with appropriate decimal places
  if (amount >= 1) {
    return amount.toFixed(4)
  } else if (amount >= 0.01) {
    return amount.toFixed(6)
  } else {
    return amount.toFixed(8)
  }
}

export const parseEthInput = (input: string): string => {
  // Clean and format user input
  return input
    .replace(/[^0-9.]/g, "") // Remove non-numeric characters except decimal
    .replace(/(\..*)\./g, "$1") // Prevent multiple decimal points
}
