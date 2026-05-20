import { createContext, forwardRef, useContext, useId, useMemo } from 'react'
import { ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts'
import { cn } from '../../lib/utils'

const ChartContext = createContext(null)

function useChart() {
  const ctx = useContext(ChartContext)
  if (!ctx) throw new Error('useChart must be used within a <ChartContainer />')
  return ctx
}

export const ChartContainer = forwardRef(function ChartContainer(
  { id, className, children, config, style, ...props },
  ref,
) {
  const uniqueId = useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  const mergedStyle = useMemo(() => {
    const out = { ...(style ?? {}) }
    Object.entries(config ?? {}).forEach(([key, value]) => {
      if (value?.color) out[`--color-${key}`] = value.color
    })
    return out
  }, [config, style])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        style={mergedStyle}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-slate-500",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-slate-100",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-200",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-slate-200",
          "[&_.recharts-radial-bar-background-sector]:fill-slate-100",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-100",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-slate-300",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-none",
          "[&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})

export const ChartTooltip = RechartsTooltip

export const ChartTooltipContent = forwardRef(function ChartTooltipContent(
  {
    active,
    payload,
    label,
    labelFormatter,
    formatter,
    valueFormatter,
    hideLabel = false,
    hideIndicator = false,
    indicator = 'dot',
    nameKey,
    labelKey,
    className,
  },
  ref,
) {
  const { config } = useChart()

  const labelNode = useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey || item.dataKey || item.name || 'value'}`
    const itemConfig = getConfigFromPayload(config, item, key)
    const labelText =
      !labelKey && typeof label === 'string'
        ? config?.[label]?.label ?? label
        : itemConfig?.label ?? label
    if (labelFormatter) {
      return <div className="font-medium text-slate-900">{labelFormatter(labelText, payload)}</div>
    }
    if (!labelText) return null
    return <div className="font-medium text-slate-900">{labelText}</div>
  }, [label, labelFormatter, payload, hideLabel, labelKey, config])

  if (!active || !payload?.length) return null

  return (
    <div
      ref={ref}
      className={cn(
        'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-card',
        className,
      )}
    >
      {labelNode}
      <div className="grid gap-1.5">
        {payload.map((item, i) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemConfig = getConfigFromPayload(config, item, key)
          const color = item.payload?.fill || item.color || itemConfig?.color
          return (
            <div
              key={item.dataKey ?? i}
              className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-slate-500"
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, i, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <span
                      className={cn('shrink-0 rounded-[2px]', {
                        'h-2.5 w-2.5': indicator === 'dot',
                        'w-1': indicator === 'line',
                        'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                      })}
                      style={{ backgroundColor: color, borderColor: color }}
                    />
                  )}
                  <div className="flex flex-1 justify-between leading-none items-center">
                    <span className="text-slate-500">{itemConfig?.label ?? item.name}</span>
                    {item.value !== undefined && item.value !== null && (
                      <span className="font-mono font-medium tabular-nums text-slate-900">
                        {valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString?.() ?? item.value}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

export const ChartLegend = RechartsLegend

export const ChartLegendContent = forwardRef(function ChartLegendContent(
  { className, payload, verticalAlign = 'bottom', nameKey },
  ref,
) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-center gap-4 flex-wrap',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload.map(item => {
        const key = `${nameKey || item.dataKey || 'value'}`
        const itemConfig = getConfigFromPayload(config, item, key)
        return (
          <div
            key={item.value}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {itemConfig?.label ?? item.value}
          </div>
        )
      })}
    </div>
  )
})

function getConfigFromPayload(config, payload, key) {
  if (!config) return undefined
  const payloadPayload = payload?.payload
  let configKey = key
  if (payload && key in payload && typeof payload[key] === 'string') {
    configKey = payload[key]
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === 'string') {
    configKey = payloadPayload[key]
  }
  return configKey in config ? config[configKey] : config[key]
}
