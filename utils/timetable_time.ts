export const isCurrentPeriod = (
    startTime: string,
    endTime: string,
    effectiveDate: string //
  ): boolean => {
    const now = new Date();

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
  
    const start = new Date(effectiveDate);
    start.setHours(sh, sm, 0, 0);
  
    const end = new Date(effectiveDate);
    end.setHours(eh, em, 0, 0);

    return now >= start && now <= end;
  };
  
  