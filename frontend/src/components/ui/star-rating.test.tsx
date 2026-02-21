import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StarRating } from "@/components/ui/star-rating"

describe("StarRating", () => {
  it("renders 4.5/5 with four full stars and one half star", () => {
    render(<StarRating confidence={0.88} />)

    expect(screen.getByText("4.5/5")).toBeInTheDocument()
    expect(screen.getByLabelText("Rating 4.5 out of 5")).toBeInTheDocument()
    expect(screen.getAllByTestId("star-full")).toHaveLength(4)
    expect(screen.getAllByTestId("star-half")).toHaveLength(1)
    expect(screen.queryAllByTestId("star-empty")).toHaveLength(0)
  })

  it("renders 4/5 with four full stars and one empty star", () => {
    render(<StarRating confidence={0.84} />)

    expect(screen.getByText("4/5")).toBeInTheDocument()
    expect(screen.getByLabelText("Rating 4 out of 5")).toBeInTheDocument()
    expect(screen.getAllByTestId("star-full")).toHaveLength(4)
    expect(screen.queryAllByTestId("star-half")).toHaveLength(0)
    expect(screen.getAllByTestId("star-empty")).toHaveLength(1)
  })

  it("renders 0/5 with five empty stars", () => {
    render(<StarRating confidence={0} />)

    expect(screen.getByText("0/5")).toBeInTheDocument()
    expect(screen.queryAllByTestId("star-full")).toHaveLength(0)
    expect(screen.queryAllByTestId("star-half")).toHaveLength(0)
    expect(screen.getAllByTestId("star-empty")).toHaveLength(5)
  })

  it("renders 5/5 with five full stars", () => {
    render(<StarRating confidence={1} />)

    expect(screen.getByText("5/5")).toBeInTheDocument()
    expect(screen.getAllByTestId("star-full")).toHaveLength(5)
    expect(screen.queryAllByTestId("star-half")).toHaveLength(0)
    expect(screen.queryAllByTestId("star-empty")).toHaveLength(0)
  })
})
