/**
 * PrimitivesToggle - Collapsible primitives tools palette
 *
 * Shows a button with primitive shapes icon that expands to show the full palette
 */

import { useState } from 'react'
import { PrimitivesPalette, type PrimitiveTool } from './PrimitivesPalette'

interface PrimitivesToggleProps {
  activeTool: PrimitiveTool
  onToolSelect: (tool: PrimitiveTool) => void
}

export function PrimitivesToggle({ activeTool, onToolSelect }: PrimitivesToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* Primitives palette - shows when expanded */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          <PrimitivesPalette
            activeTool={activeTool}
            onToolSelect={(tool) => {
              onToolSelect(tool)
              // Keep open after selection so user can see what's active
            }}
          />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        title="Primitives tools"
        style={{
          width: 56,
          height: 56,
          border: '2px solid #111',
          borderRadius: 12,
          background: isExpanded ? '#111' : 'rgba(255, 255, 255, 0.95)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1.05)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {/* Three primitive shapes icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 700 350"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: isExpanded ? 'invert(1)' : 'none',
          }}
        >
          {/* Coral/organic shape (left) */}
          <path
            d="M 75,280
               C 75,240 90,200 110,170
               C 120,150 135,140 150,120
               C 155,110 158,95 165,85
               C 170,78 178,75 185,68
               C 195,58 200,45 205,32
               L 215,28
               C 222,35 228,42 232,50
               C 238,62 240,75 242,88
               L 245,95
               C 250,85 258,77 268,72
               C 275,68 283,68 290,70
               C 298,73 305,78 310,85
               C 318,95 322,108 322,120
               L 318,135
               C 312,125 302,118 290,115
               L 280,118
               C 268,125 260,138 258,152
               L 255,165
               C 248,175 238,182 228,188
               C 215,195 200,198 185,198
               L 165,195
               C 155,192 145,188 138,182
               C 125,172 115,158 108,142
               C 98,120 90,98 88,75
               L 92,68
               C 88,95 90,122 98,148
               C 102,162 108,175 118,185
               C 125,192 135,198 145,202
               L 165,205
               C 178,205 190,202 202,195
               L 215,185
               C 222,178 228,170 232,160
               L 238,145
               C 242,128 252,112 268,105
               L 285,102
               C 298,105 310,112 318,122
               L 325,135
               C 328,150 325,165 318,178
               C 312,188 302,195 290,198
               L 270,200
               C 255,198 242,190 232,178
               L 222,160
               C 218,148 218,135 222,122
               L 228,108
               C 222,118 218,130 218,142
               C 218,155 222,168 230,178
               C 238,188 250,195 262,198
               L 280,198
               C 292,195 302,188 310,178
               C 318,168 322,155 322,142
               L 318,128
               C 312,115 302,105 288,100
               L 272,98
               C 258,102 248,112 242,125
               L 238,142
               C 235,158 228,172 218,183
               L 205,192
               C 192,198 178,202 162,202
               L 142,198
               C 130,195 118,188 110,178
               C 98,165 90,148 85,130
               C 78,108 75,85 75,62
               L 80,50
               C 75,80 78,110 88,138
               C 95,158 105,175 120,188
               C 130,198 143,205 158,208
               L 180,210
               C 195,208 208,202 220,192
               L 235,178
               C 243,168 248,155 250,142
               L 255,125
               C 260,108 272,95 288,88
               L 308,85
               C 322,88 335,98 342,110
               L 348,128
               C 350,145 345,162 335,175
               C 325,188 310,195 295,198
               L 272,200
               C 255,195 242,185 232,170
               L 225,150
               C 222,135 225,120 232,108
               L 242,95
               C 235,108 232,122 232,138
               C 232,152 238,165 248,175
               C 258,185 272,192 288,195
               L 308,195
               C 322,190 332,180 340,168
               C 348,155 350,138 348,122
               L 342,105
               C 335,92 322,82 308,78
               L 288,75
               C 272,80 260,92 252,108
               L 248,128
               C 245,145 238,160 228,172
               L 212,185
               C 198,195 182,200 165,202
               L 142,198
               C 128,192 115,182 105,170
               C 92,152 82,132 78,110
               C 72,85 70,58 75,32
               Z"
            fill="#111"
          />

          {/* Tree/hand shape (middle) */}
          <path
            d="M 380,85
               L 372,95
               C 368,102 365,110 365,118
               L 362,135
               C 360,145 358,155 358,165
               L 360,195
               C 362,215 365,235 370,255
               L 375,275
               C 378,285 382,295 388,303
               L 395,310
               C 390,305 385,298 382,290
               L 375,270
               C 370,250 368,228 368,208
               L 370,175
               C 372,162 375,150 380,138
               L 388,122
               C 395,110 405,100 418,95
               L 425,92
               C 418,88 410,85 402,85
               L 390,88
               Z
               M 425,75
               C 432,75 438,78 443,82
               L 450,90
               C 455,98 458,108 458,118
               L 455,135
               C 452,148 448,160 442,170
               L 435,180
               C 445,172 452,160 458,148
               L 465,130
               C 468,118 468,105 465,92
               L 460,78
               C 455,68 448,60 438,55
               L 425,52
               C 412,52 400,58 390,68
               L 382,80
               C 375,92 372,105 372,120
               L 375,142
               C 378,162 385,180 395,198
               L 405,215
               C 412,228 418,242 422,258
               L 425,280
               C 428,295 428,310 425,325
               L 420,338
               C 425,322 428,305 428,288
               L 425,260
               C 422,242 415,225 408,210
               L 398,190
               C 388,170 382,148 380,125
               L 382,102
               C 385,88 392,75 402,65
               L 418,58
               L 425,75
               Z"
            fill="#111"
          />

          {/* Amoeba/blob shape (right) */}
          <path
            d="M 620,120
               C 625,115 632,112 640,112
               L 655,115
               C 665,118 672,125 678,132
               L 685,145
               C 690,158 692,172 690,185
               L 685,205
               C 680,220 670,232 658,240
               L 642,248
               C 628,252 612,252 598,248
               L 580,240
               C 568,235 558,225 552,212
               L 548,195
               C 545,180 548,165 555,152
               L 565,140
               C 572,132 582,125 595,122
               L 610,120
               L 620,120
               Z
               M 640,100
               C 628,100 618,105 610,112
               L 598,125
               C 588,138 582,155 582,172
               L 585,192
               C 588,208 595,222 608,232
               L 625,242
               C 640,248 658,248 672,242
               L 688,232
               C 700,222 708,208 712,192
               L 715,172
               C 715,155 710,138 700,125
               L 688,112
               C 678,105 665,100 652,100
               L 640,100
               Z
               M 630,145
               C 632,142 635,140 640,140
               C 645,140 648,142 650,145
               C 652,148 652,152 650,155
               C 648,158 645,160 640,160
               C 635,160 632,158 630,155
               C 628,152 628,148 630,145
               Z
               M 650,175
               C 655,175 660,178 662,182
               C 665,188 665,195 662,202
               C 660,208 655,212 648,212
               L 632,208
               C 625,205 620,200 618,192
               L 618,180
               C 620,172 625,168 632,165
               L 648,162
               L 650,175
               Z"
            fill="#111"
          />
        </svg>

        {/* Active indicator dot */}
        {activeTool !== 'hand' && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF9A1A',
              border: '1px solid white',
            }}
          />
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
