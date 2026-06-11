import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatChart from './ChatChart'

vi.mock('../charts/LineChart', () => ({
  default: props => <div data-testid="line-chart"
    data-rows={props.data.length} data-xkey={props.xKey} data-ykey={props.yKey}
    data-groupkey={props.groupKey ?? ''} />,
}))
vi.mock('../charts/BarChart', () => ({
  default: props => <div data-testid="bar-chart"
    data-rows={props.data.length} data-labelkey={props.labelKey} data-valuekey={props.valueKey} />,
}))
vi.mock('../charts/DonutChart', () => ({
  default: props => <div data-testid="donut-chart"
    data-rows={props.data.length}
    data-haslabelvalue={String(props.data.every(d => 'label' in d && 'value' in d))} />,
}))
vi.mock('../charts/ScatterChart', () => ({
  default: props => <div data-testid="scatter-chart"
    data-xkey={props.xKey} data-ykey={props.yKey} data-labelkey={props.labelKey} />,
}))

const RANKING = Array.from({ length: 30 }, (_, i) => ({ name: `C${i}`, total: 100 - i }))

describe('ChatChart', () => {
  it('renders nothing when spec is null', () => {
    const { container } = render(<ChatChart data={RANKING} spec={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a LineChart and passes axis/group keys', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'line', x: 'name', y: 'total', series: 'name' }} />)
    const el = screen.getByTestId('line-chart')
    expect(el).toHaveAttribute('data-xkey', 'name')
    expect(el).toHaveAttribute('data-ykey', 'total')
  })

  it('renders a BarChart capped to 15 rows', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'bar', x: 'name', y: 'total', series: null }} />)
    const el = screen.getByTestId('bar-chart')
    expect(Number(el.getAttribute('data-rows'))).toBeLessThanOrEqual(15)
    expect(el).toHaveAttribute('data-labelkey', 'name')
    expect(el).toHaveAttribute('data-valuekey', 'total')
  })

  it('renders a DonutChart with {label,value} rows capped to 8', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'donut', x: 'name', y: 'total', series: null }} />)
    const el = screen.getByTestId('donut-chart')
    expect(Number(el.getAttribute('data-rows'))).toBeLessThanOrEqual(8)
    expect(el).toHaveAttribute('data-haslabelvalue', 'true')
  })

  it('renders a ScatterChart with x/y/label keys', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'scatter', x: 'total', y: 'total', series: 'name' }} />)
    const el = screen.getByTestId('scatter-chart')
    expect(el).toHaveAttribute('data-xkey', 'total')
    expect(el).toHaveAttribute('data-labelkey', 'name')
  })
})
