import { useState } from "react";

import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";

import { TagFilterContent } from "./tag-filter-content";

// Demo component to test TagFilterContent
export function TagFilterContentDemo() {
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);

  const handleTagsChange = (tags: TagConfig[]) => {
    setSelectedTags(tags);
    console.log("Selected tags:", tags);
  };

  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold mb-4">Tag Filter Content Demo</h2>
      <div className="border border-gray-200 rounded-lg p-4">
        <TagFilterContent
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          resource={TagResource.PATIENT}
          placeholder="Filter by tags"
        />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Selected Tags:</h3>
        {selectedTags.length === 0 ? (
          <p className="text-gray-500 text-sm">No tags selected</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {tag.display}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
