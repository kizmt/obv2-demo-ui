import { formatNumber } from '@/utils/utils';
import { useEffect, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export const BarchartVisualiser = ({limitPrice, orderSize, orderSide, placementStrat, tick, orderCount, setBatchOrders}) => {

  const [chart, setChart] = useState(null);
  useEffect(() => {
    let price = Number(limitPrice);
    let orders = [];
    let sumOfMultipliers = 0;
    
    if(placementStrat === 1) { // linear
      sumOfMultipliers = (Number(orderCount) * (Number(orderCount) + 1)) / 2;
    }
    else if(placementStrat === 2) { // curve
      for (let i = 1; i <= Number(orderCount); i++) {
        sumOfMultipliers += i * i;
      }
    }
    for(let i = 1; i <= Number(orderCount); i++) {
      if(price <= 0) continue;
      if(placementStrat === 0) { // equal
        orders.push({
          price: price,
          amount: Number(orderSize) / Number(orderCount),
          side: Number(orderSide)
        })
      } else if(placementStrat === 1) { // linear
        orders.push({
          price: price,
          amount: (i / sumOfMultipliers) * Number(orderSize),
          side: Number(orderSide)
        })
      } else if(placementStrat === 2) { // curve
        orders.push({
          price: price,
          amount: (i * i / sumOfMultipliers) * Number(orderSize),
          side: Number(orderSide)
        })
      }
      

      if(orderSide === 0) {
        price -= Number(tick);
      } else {
        price += Number(tick);
      }
    }
    let total = 0;
    orders.map(order => total += order.amount)
    if(orderSide === 0) { // reverse chart
      orders.reverse()
    }
    console.log("total", total)
    setBatchOrders(orders);
    setChart(orders);
  }, [limitPrice, orderSize, tick, orderCount, orderSide, placementStrat])

  if(!chart)
  return <div className="w-full text-center h[100px]">
    <p className='text-muted-foreground text-sm'>Please enter details</p>
  </div>

  return <div className="w-full h-[100px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart width={150} height={100} data={chart}>
        <XAxis dataKey="price" tickLine={false} axisLine={false} tickFormatter={(tick) => formatNumber(tick, "auto")}/>
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" fill={orderSide === 0 ? "var(--green700)" : "var(--red700)"} />
      </BarChart>
    </ResponsiveContainer>
  </div>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="flex flex-col bg-background-over w-[100px] p-3 border rounded-2xl gap-2">
        <div className='flex flex-col gap-1'>
          <p className="text-xs text-muted-foreground">Order Size</p>
          <p className="text-sm font-bold">{formatNumber(payload[0].value, "auto")}</p>
        </div>
      </div>
    );
  }

  return null;
};