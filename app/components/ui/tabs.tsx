'use client'

import { useState } from 'react'

type Tab = {
  title: string
  content: React.ReactNode
}

type TabsProps = {
  tabs: Tab[]
  tabsStyle?: string
  contentClassName?: string
}

export function Tabs({ tabs, tabsStyle = '', contentClassName = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      {/* Abas */}
      <div className={`flex gap-4 ${tabsStyle}`}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === index
                ? 'border-[#3f7fcf] text-[#3f7fcf]'
                : 'border-transparent text-gray-500 hover:text-[#3f7fcf]'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className={`${contentClassName}`}>
        {tabs[activeTab]?.content}
      </div>
    </div>
  )
}
