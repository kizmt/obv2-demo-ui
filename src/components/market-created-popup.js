import { useEffect } from "react"
import { CheckmarkIcon } from "react-hot-toast"
import { Button } from "./ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export const MarketCreatedPopup = ({open, onClose, market=null}) => {

  useEffect(() => {
    if(market) {
      let localMarkets = localStorage.getItem('localMarkets');
      if(localMarkets) {
        localMarkets = JSON.parse(localMarkets);
        localMarkets.push(market);
        localStorage.setItem('localMarkets', JSON.stringify(localMarkets));
      } else {
        localStorage.setItem('localMarkets', JSON.stringify([market]));
      }
    }
  }, [market]);

  return <Dialog 
    open={open}
    onOpenChange={() => onClose()}
  >
    <DialogTrigger></DialogTrigger>
    <DialogContent className="max-w-[380px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckmarkIcon/>
          Market Created
        </DialogTitle>
        <DialogDescription>
          Congratulations, you've created a new market!
        </DialogDescription>
      </DialogHeader>
      <div className="w-full flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Market Address:
        </p>
        <p className="text-xs">
          {
            market
          }
        </p>
        <div className="w-full flex items-center gap-2 mt-4">
          <Link href={`/trade/v2/${market}`} className="w-full">
            <Button variant={"default"} className="w-full bg-white text-black hover:bg-slate-200">
              Go to Market
            </Button>
          </Link>
          <Link href={`https://forms.gle/GY7TpWoYdXvgkmo3A`} target="_blank" className="w-full">
            <Button variant={"default"} className="w-full bg-white text-black hover:bg-slate-200">
              List Market
            </Button>
          </Link>
        </div>
      </div>
    </DialogContent>
  </Dialog>
}
