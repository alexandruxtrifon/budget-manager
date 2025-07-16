// Function to find matching category based on transaction description
export function findMatchingCategory(description, categories) {
  if (!description) return null;

  // Normalize description: lowercase, remove spaces, and special characters
  const normalizedDescription = description
    .toLowerCase()
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Remove punctuation

  for (const category of categories) {
    if (category.match_keywords && category.match_keywords.length > 0) {
      for (const keyword of category.match_keywords) {
        if (!keyword) continue;

        // Normalize keyword the same way
        const normalizedKeyword = keyword
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

        // Check if normalized description contains normalized keyword
        if (normalizedDescription.includes(normalizedKeyword)) {
          console.log(
            `Matched "${description}" to category "${category.name}" with keyword "${keyword}"`
          );
          return category.category_id;
        }
      }
    }
  }

  return null; // No match found
}
