export const startOfTodayUtc = (): Date => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

export const endOfDayUtc = (date: Date): Date => {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};
