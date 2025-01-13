import React, { useState } from 'react'
import { cn } from "@/lib/utils"

// Define a base interface for selectable items
interface BaseItem {
  id: number
  [key: string]: string | number | boolean // Allow string, number, or boolean values
}

interface EnhancedSelectProps<T extends BaseItem> {
  items: T[]
  value: number
  onChange: (id: number) => void
  onSearch: (text: string) => void
  placeholder: string
  loading?: boolean
  labelKey?: keyof T
  className?: string
}

function EnhancedSelect<T extends BaseItem>({ 
  items, 
  value,
  onChange,
  onSearch,
  placeholder,
  loading,
  labelKey = 'name' as keyof T,
  className
}: EnhancedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  const selectedItem = items.find(item => item.id === value)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setSearchText(text)
    onSearch(text)
  }

  // Type guard to ensure the label value is a string
  const getItemLabel = (item: T): string => {
    const label = item[labelKey]
    return typeof label === 'string' ? label : String(label)
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Selected Value Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border rounded bg-white text-black cursor-pointer flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="truncate">
          {selectedItem ? getItemLabel(selectedItem) : placeholder}
        </span>
        <span className="text-gray-500">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg">
          <input
            type="text"
            value={searchText}
            onChange={handleSearch}
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="w-full p-2 border-b text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onChange(item.id)
                  setIsOpen(false)
                  setSearchText('')
                }}
                className={cn(
                  "p-2 cursor-pointer hover:bg-blue-50",
                  item.id === value ? "bg-blue-100" : ""
                )}
              >
                {getItemLabel(item)}
              </div>
            ))}
            {loading && (
              <div className="p-2 text-gray-500 text-center">
                Loading more...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedSelect