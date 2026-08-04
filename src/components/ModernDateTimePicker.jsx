import React, { useState, useRef, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import './ModernDateTimePicker.css';

export default function ModernDateTimePicker({ value, onChange, placeholder = "Select date & time" }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Default to empty string if invalid
  const dateObj = value ? new Date(value) : null;
  const validDate = isValid(dateObj) ? dateObj : undefined;

  const [timeStr, setTimeStr] = useState(validDate ? format(validDate, 'HH:mm') : '');

  useEffect(() => {
    if (value && isValid(new Date(value))) {
      setTimeStr(format(new Date(value), 'HH:mm'));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedDate) => {
    if (!selectedDate) return;
    let newDate = new Date(selectedDate);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
    }
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (e) => {
    const newTimeStr = e.target.value;
    setTimeStr(newTimeStr);
    if (validDate) {
      const newDate = new Date(validDate);
      const [hours, minutes] = newTimeStr.split(':');
      newDate.setHours(parseInt(hours, 10) || 0);
      newDate.setMinutes(parseInt(minutes, 10) || 0);
      onChange(newDate.toISOString());
    }
  };

  return (
    <div className="modern-dt-picker" ref={wrapperRef}>
      <button 
        type="button" 
        className="modern-dt-picker__btn" 
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon size={16} className="modern-dt-picker__icon" />
        <span className="modern-dt-picker__text">
          {validDate ? format(validDate, 'PPP, p') : placeholder}
        </span>
      </button>

      {open && (
        <div className="modern-dt-picker__popover">
          <DayPicker
            mode="single"
            selected={validDate}
            onSelect={handleSelect}
            className="modern-dt-picker__calendar"
          />
          <div className="modern-dt-picker__time-wrap">
            <Clock size={16} />
            <input 
              type="time" 
              value={timeStr} 
              onChange={handleTimeChange} 
              className="modern-dt-picker__time-input" 
            />
          </div>
          <button type="button" className="modern-dt-picker__close" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
