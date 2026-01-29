import React from "react";
import { Tooltip } from "recharts";

interface PinnedTooltipProps {
  hoveredSlice: any | null;
  pinned: boolean;
  onPinChange: (pinned: boolean) => void;
  total: number;
  actionNames?: string[];
  onAction?: (data: any) => void;
  actionLabel?: (name: string) => string;
  itemLabel?: string;
}

const PinnedTooltip: React.FC<PinnedTooltipProps> = ({
  hoveredSlice,
  pinned,
  onPinChange,
  total,
  actionNames = [],
  onAction,
  actionLabel,
  itemLabel = "students"
}) => (
  <Tooltip
    active={pinned || Boolean(hoveredSlice)}
    wrapperStyle={{ pointerEvents: "auto", opacity: 1, zIndex: 50 }}
    allowEscapeViewBox={{ x: true, y: true }}
    cursor={false}
    content={({ active, payload }) => {
      const data = payload?.[0] ?? hoveredSlice;

      if ((active || pinned) && data) {
        const sliceName = (data.payload?.name ?? data.name) as string | undefined;
        const isActionable = !!sliceName && actionNames.includes(sliceName);
        const percentBase = total || 1;
        const label = sliceName ? sliceName.toLowerCase() : "item";

        return (
          <div
            className="pinned-tooltip bg-white/100 opacity-100 p-3 border border-gray-200 rounded-lg shadow-lg ring-1 ring-black/5"
            onMouseEnter={() => onPinChange(true)}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block w-3 h-3 flex-shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: data.color ?? data.payload?.color ?? "#94a3b8" }}
              />
              <span className="font-semibold text-sm text-gray-900">
                {sliceName ?? data.name}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                <span className="font-medium text-gray-900">{data.value}</span> {itemLabel}
              </div>
              <div className="text-xs text-gray-500">
                {((data.value / percentBase) * 100).toFixed(1)}% of total
              </div>
            </div>
            {isActionable && onAction && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAction(data.payload ?? data);
                }}
                className="mt-2 w-full rounded bg-main px-2 py-1 text-xs text-white hover:bg-main/90"
              >
                {actionLabel ? actionLabel(label) : `View ${label} list`}
              </button>
            )}
          </div>
        );
      }

      return null;
    }}
  />
);

export default PinnedTooltip;
