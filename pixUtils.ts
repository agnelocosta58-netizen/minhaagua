
export function generatePixPayload(key: string, name: string, city: string, amount: number) {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = "br.gov.bcb.pix";
  const merchantAccountInfo = formatField('00', gui) + formatField('01', key);
  
  let payload = "000201"; // Payload Format Indicator
  payload += formatField('26', merchantAccountInfo); // Merchant Account Info
  payload += "52040000"; // Merchant Category Code
  payload += "5303986"; // Transaction Currency (986 = BRL)
  
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2)); // Transaction Amount
  }
  
  payload += "5802BR"; // Country Code
  payload += formatField('59', name.substring(0, 25).toUpperCase()); // Merchant Name
  payload += formatField('60', city.substring(0, 15).toUpperCase()); // Merchant City
  payload += "62070503***"; // Additional Data Field
  payload += "6304"; // CRC16 indicator

  // CRC16-CCITT (0x1021)
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
    crc &= 0xFFFF;
  }
  
  const finalCrc = crc.toString(16).toUpperCase().padStart(4, '0');
  return payload + finalCrc;
}
