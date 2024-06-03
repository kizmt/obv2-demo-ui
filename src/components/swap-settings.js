import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"

export const SwapSettingsPopup = ({
  open, 
  onClose, 
  slippage, 
  setSlippage, 
  customSlippage, 
  setCustomSlippage, 
  useWSol, 
  setUseWSol, 
  excludeDexes, 
  setExcludeDexes,
  directRouteOnly,
  setDirectRouteOnly,
}) => {

  const [dexPopup, setDexPopup] = useState(false);
  const [dexList, setDexList] = useState([]);

  useEffect(() => {
    fetch('https://quote-api.jup.ag/v6/program-id-to-label').then((res) => res.json()).then((res) => {
      let list = res;
      let arr = [];
      Object.keys(list).forEach((key) => {
        arr.push({
          label: list[key],
          value: key
        })
      });
      setDexList(arr);
    });
  }, [])
  return <>
  <Dialog 
    open={open}
    onOpenChange={() => onClose()}
  >
    <DialogTrigger/>
    <DialogContent className="max-w-[320px] p-4 rounded-sm md:max-w-[380px]">
      <DialogHeader>
        <DialogTitle>Swap Settings</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            Set Slippage Tolerance & other settings.
          </p>
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="w-full flex flex-col gap-2">
          <p className="text-sm font-bold text-center md:text-left">
            Slippage Tolerance
          </p>
          <div className="w-full h-14 grid grid-cols-6 divide-x border rounded-sm overflow-hidden items-center">
            <div onClick={() => {
              setSlippage(10)
              setCustomSlippage("")
              }} className={`w-full select-none transition-all cursor-pointer h-full flex ${slippage === 10 ? 'bg-background-over text-secondary' : 'text-muted-foreground hover:text-white'} items-center justify-center text-sm font-bold p-1`}>
              0.1%
            </div>
            <div onClick={() => {
              setSlippage(50)
              setCustomSlippage("")
              }} className={`w-full select-none transition-all cursor-pointer h-full flex ${slippage === 50 ? 'bg-background-over text-secondary' : 'text-muted-foreground hover:text-white'} items-center justify-center text-sm font-bold p-1`}>
              0.5%
            </div>
            <div onClick={() => {
              setSlippage(100)
              setCustomSlippage("")
              }} className={`w-full select-none transition-all cursor-pointer h-full flex ${slippage === 100 ? 'bg-background-over text-secondary' : 'text-muted-foreground hover:text-white'} items-center justify-center text-sm font-bold p-1`}>
              1%
            </div>
            <div onClick={() => {
              setSlippage(500)
              setCustomSlippage("")
            }} className={`w-full select-none transition-all cursor-pointer h-full flex ${slippage === 500 ? 'bg-background-over text-secondary' : 'text-muted-foreground hover:text-white'} items-center justify-center text-sm font-bold p-1`}>
              5%
            </div>
            <div className={`w-full select-none focus:bg-background-over relative h-full flex flex-col items-end col-span-2 ${(slippage !== 10 && slippage !== 50 && slippage !== 100 && slippage !== 500) ? 'bg-background-over text-cyan-500' : 'text-muted-foreground'} justify-center text-xs font-bold p-1`}>
              <input
                className="w-full h-full bg-transparent outline-none text-sm text-left px-4"
                value={customSlippage}
                onChange={(e) => {
                  if(parseFloat(e.target.value) > 5000) setCustomSlippage("5000");
                  else
                  setCustomSlippage(e.target.value)
                }}
                placeholder="Custom"
                onWheel={(e) => e.target.blur()} 
                lang="en" 
                type="number" 
                inputMode='decimal' 
                pattern="[0-9]*"
              />
              <p className="text-sm absolute font-bold right-2">%</p>
            </div>
          </div>
        </div>
        
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold">Use Wrapped SOL</p>
              <p className="text-xs text-muted-foreground">If enabled, you'll need to have wrapped SOL</p>
            </div>
            <Switch
              id="useWsol"
              checked={useWSol}
              onClick={() => setUseWSol(!useWSol)}
            />
          </div>
        </div>
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold">Direct Routes Only</p>
              <p className="text-xs text-muted-foreground">Only route swaps to a single dex</p>
            </div>
            <Switch
              id="directRoutes"
              checked={directRouteOnly}
              onClick={() => {
                setDirectRouteOnly(!directRouteOnly)
                localStorage.setItem('directRouteOnly', !directRouteOnly)
              }}
            />
          </div>
        </div>
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold">Excluded Dexes</p>
              <p className="text-xs text-muted-foreground">
                Exclude Dexes from aggregation routing
              </p>
              {
                <p className="text-xs text-muted-foreground">
                  {excludeDexes.length} Dexes Excluded
                </p>
              }
            </div>
            <Button
              onClick={() => setDexPopup(true)} 
              variant="outline" 
              className="text-xs"
              >
              Select
            </Button>
          </div>
        </div>
        
        
      </div>
    </DialogContent>
  </Dialog>

  {
    dexPopup &&
    <Dialog 
      open={dexPopup}
      onOpenChange={() => setDexPopup(false)}
    >
      <DialogTrigger/>
      <DialogContent className="max-w-[320px] p-4 rounded-sm md:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Excluded Dexes</DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              Select Dexes to Exclude from aggregation routing.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="w-full grid divide-y max-h-[400px] overflow-y-scroll flex-col">
            {
              // sort dexList by if label is in excludeDexes
              dexList.length > 0 ?
              dexList.sort(
                (a,b) => {
                  if(excludeDexes.includes(a.label) && !excludeDexes.includes(b.label)) return -1;
                  if(!excludeDexes.includes(a.label) && excludeDexes.includes(b.label)) return 1;
                  return 0;
                }
              ).map((item,i) => {
                return <div key={i} className="w-full h-12 flex items-center justify-between">
                  <p className="text-sm font-bold">{item.label}</p>
                  <Switch
                    id={item.value}
                    checked={excludeDexes.includes(item.label)}
                    onClick={() => {
                      if(excludeDexes.includes(item.label)) {
                        setExcludeDexes(excludeDexes.filter((dex) => dex !== item.label))
                        localStorage.setItem('excludeDexes', JSON.stringify(excludeDexes.filter((dex) => dex !== item.label)))
                      } else {
                        setExcludeDexes([...excludeDexes, item.label])
                        localStorage.setItem('excludeDexes', JSON.stringify([...excludeDexes, item.label]))
                      }
                    }}
                  />
                </div>
              })
              :
              ""
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  }
  </>
}