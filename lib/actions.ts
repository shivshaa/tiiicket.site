const handleNetworkError = (error: any) => {
  console.error("Network error:", error)
  if (error.message?.includes("blob:") || error.message?.includes("Failed to load")) {
    throw new Error("Network connection issue. Please check your internet connection and try again.")
  }
  throw error
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {\
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// Example usage (replace with your actual database operations)
const fetchData = async () => {\
  try {\
    const data = await withTimeout(Promise.resolve("Data from database"), 5000); // Simulate a database call
    return data;
  } catch (error) {\
    handleNetworkError(error);
  }
};

export { fetchData };\
