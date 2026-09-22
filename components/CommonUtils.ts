export function formatNumber(num:any ) {
    let numStr = num.toString();
    if (numStr.includes('.')) {      
        let [integerPart, decimalPart] = numStr.split('.');
        decimalPart = decimalPart.slice(0, 3);
        while (decimalPart.length < 3) {
            decimalPart += '0';
        }
        return `${integerPart}.${decimalPart}`;
    }else {
        return numStr;
    }
}

export const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Get number of days in a month
export function daysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  