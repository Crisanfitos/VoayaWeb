"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  fromDate?: Date
  locale?: any
  className?: string
  initialFocus?: boolean
}

const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  fromDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    // Convert Sunday (0) to 7, and shift Monday to 1
    return day === 0 ? 6 : day - 1
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: (number | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

    if (disabled && disabled(newDate)) {
      return
    }

    onSelect?.(newDate)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isDisabled = (day: number) => {
    if (!disabled) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return disabled(date)
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className={cn("p-3", className)}>
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 bg-transparent p-0 text-muted-foreground hover:text-voaya-primary hover:bg-voaya-primary/10 transition-colors"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-sm font-bold capitalize text-voaya-primary">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 bg-transparent p-0 text-muted-foreground hover:text-voaya-primary hover:bg-voaya-primary/10 transition-colors"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-muted-foreground text-center text-[0.8rem] font-normal h-9 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((day, index) => (
          <div key={index} className="h-9 w-full flex items-center justify-center p-0">
            {day ? (
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={isDisabled(day)}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal rounded-lg transition-all",
                  isSelected(day) && "bg-voaya-primary text-white hover:bg-voaya-primary hover:text-white",
                  !isSelected(day) && "hover:bg-voaya-primary hover:text-white",
                  isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground",
                  isDisabled(day) && "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                )}
              >
                {day}
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
