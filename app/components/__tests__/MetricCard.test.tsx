import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '../dashboard/MetricCard'

describe('MetricCard', () => {
  it('should render metric value correctly', () => {
    render(
      <MetricCard
        title="Total Spend"
        value="$10,500"
        trend={5.2}
        isPositive={false}
        icon="💰"
      />
    )

    expect(screen.getByText('Total Spend')).toBeInTheDocument()
    expect(screen.getByText('$10,500')).toBeInTheDocument()
  })

  it('should show positive trend correctly', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$50,000"
        trend={12.5}
        isPositive={true}
        icon="💵"
      />
    )

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('should show negative trend correctly', () => {
    render(
      <MetricCard
        title="CPA"
        value="$45.50"
        trend={-8.3}
        isPositive={true}
        icon="🎯"
      />
    )

    expect(screen.getByText('-8.3%')).toBeInTheDocument()
  })

  it('should display alert badge when CPA is high', () => {
    render(
      <MetricCard
        title="CPA"
        value="$180.00"
        trend={15.2}
        isPositive={false}
        icon="🎯"
        alertLevel="high"
      />
    )

    expect(screen.getByText(/ALERTA/i)).toBeInTheDocument()
  })

  it('should not display alert badge when no alert level', () => {
    render(
      <MetricCard
        title="ROAS"
        value="3.5x"
        trend={5.0}
        isPositive={true}
        icon="📈"
      />
    )

    expect(screen.queryByText(/ALERTA/i)).not.toBeInTheDocument()
  })
})
