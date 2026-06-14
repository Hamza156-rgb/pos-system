import { forwardRef } from 'react';

// Thermal receipt rendered for 58mm or 80mm printers. Designed for direct browser printing.
const Receipt = forwardRef(({ sale, shop }, ref) => {
  if (!sale) return null;
  const width = (shop?.receiptTemplate || '80mm') === '58mm' ? '54mm' : '76mm';
  const money = (n) => Number(n || 0).toFixed(2);
  return (
    <div ref={ref} style={{ width, fontFamily: 'monospace', fontSize: 12, color: '#000', padding: 4 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>{shop?.shopName || 'Store'}</div>
        <div>{shop?.address}</div>
        <div>{shop?.phone}</div>
      </div>
      <hr />
      <div>Invoice: {sale.invoiceNumber}</div>
      <div>Date: {new Date(sale.createdAt || Date.now()).toLocaleString()}</div>
      {sale.Customer?.name && <div>Customer: {sale.Customer.name}</div>}
      <hr />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Item</th><th style={{ textAlign: 'center' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(sale.items || []).map((it, i) => (
            <tr key={i}>
              <td>{it.productName}</td>
              <td style={{ textAlign: 'center' }}>{it.quantity}</td>
              <td style={{ textAlign: 'right' }}>{money(it.unitPrice)}</td>
              <td style={{ textAlign: 'right' }}>{money(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{money(sale.subtotal)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>-{money(sale.discount)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{money(sale.tax)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14 }}>
        <span>TOTAL</span><span>Rs {money(sale.grandTotal)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid ({sale.paymentMethod})</span><span>{money(sale.amountPaid)}</span></div>
      {sale.changeReturn > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change</span><span>{money(sale.changeReturn)}</span></div>}
      {sale.creditDue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Udhaar Due</span><span>{money(sale.creditDue)}</span></div>}
      <hr />
      <div style={{ textAlign: 'center' }}>{shop?.receiptFooter || 'Thank you!'}</div>
      <div style={{ textAlign: 'center', marginTop: 4 }}>{sale.barcode || sale.invoiceNumber}</div>
    </div>
  );
});

export default Receipt;

// Helper: open a clean print window with just the receipt HTML
export const printReceipt = (sale, shop) => {
  const w = window.open('', 'PRINT', 'height=600,width=400');
  const money = (n) => Number(n || 0).toFixed(2);
  const itemsHtml = (sale.items || [])
    .map((it) => `<tr><td>${it.productName}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(it.lineTotal)}</td></tr>`)
    .join('');
  const width = (shop?.receiptTemplate || '80mm') === '58mm' ? '54mm' : '76mm';
  w.document.write(`
    <html><head><title>${sale.invoiceNumber}</title>
    <style>body{font-family:monospace;font-size:12px;width:${width};margin:0 auto}table{width:100%}hr{border:none;border-top:1px dashed #000}.r{text-align:right}.c{text-align:center}.b{font-weight:bold}</style>
    </head><body>
    <div class="c b" style="font-size:16px">${shop?.shopName || 'Store'}</div>
    <div class="c">${shop?.address || ''}</div><div class="c">${shop?.phone || ''}</div><hr/>
    <div>Invoice: ${sale.invoiceNumber}</div><div>Date: ${new Date(sale.createdAt || Date.now()).toLocaleString()}</div>
    ${sale.Customer?.name ? `<div>Customer: ${sale.Customer.name}</div>` : ''}<hr/>
    <table><thead><tr><th style="text-align:left">Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><hr/>
    <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${money(sale.subtotal)}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Discount</span><span>-${money(sale.discount)}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Tax</span><span>${money(sale.tax)}</span></div>
    <div class="b" style="display:flex;justify-content:space-between;font-size:14px"><span>TOTAL</span><span>Rs ${money(sale.grandTotal)}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Paid (${sale.paymentMethod})</span><span>${money(sale.amountPaid)}</span></div>
    ${sale.changeReturn > 0 ? `<div style="display:flex;justify-content:space-between"><span>Change</span><span>${money(sale.changeReturn)}</span></div>` : ''}
    ${sale.creditDue > 0 ? `<div style="display:flex;justify-content:space-between"><span>Udhaar Due</span><span>${money(sale.creditDue)}</span></div>` : ''}
    <hr/><div class="c">${shop?.receiptFooter || 'Thank you!'}</div>
    </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 300);
};
