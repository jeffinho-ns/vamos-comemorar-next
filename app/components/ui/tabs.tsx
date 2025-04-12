// components/ui/tabs.tsx
'use client'

import { useState } from 'react'

type TabItem = {
  title: string
  content: React.ReactNode
}

type TabsProps = {
  tabs: TabItem[]
  defaultIndex?: number
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 ${
              index === activeIndex
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tabs[activeIndex].content}
      </div>
    </div>
  )
}
