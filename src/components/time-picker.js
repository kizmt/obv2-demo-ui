import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "./ui/input"
import { useState } from "react"
import { Button } from "./ui/button"
import toast from "react-hot-toast"


export const TimePicker = ({open, setCycles, setFrequency, closePopup}) => {

  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  return <Dialog open={open} onOpenChange={() => closePopup()}>
    <DialogTrigger/>
    <DialogContent className="max-w-[360px] rounded-md">
      <DialogHeader>
        <DialogTitle>Run DCA For:</DialogTitle>
      </DialogHeader>
      <div className="w-full flex flex-col gap-4">
        <div className="w-full flex items-center gap-4">
          <div className="w-full flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Days</p>
            <Input inputMode='decimal' pattern="[0-9]*" min={0} type="number" value={days} onChange={(e) => setDays(e.target.value)} className="rounded-md h-12 bg-background" placeholder="0"/>
          </div>
          <div className="w-full flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Hours</p>
            <Input inputMode='decimal' pattern="[0-9]*" min={0} max={23} type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="rounded-md h-12 bg-background" placeholder="23"/>
          </div>
          <div className="w-full flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Minutes</p>
            <Input inputMode='decimal' pattern="[0-9]*" min={0} max={59} type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="rounded-md h-12 bg-background" placeholder="59"/>
          </div>
        </div>
        <Button className="w-full h-12 bg-white text-black hover:bg-slate-300" variant={"default"} onClick={() => {
          if(hours > 23) toast.error("Hours must be less than 24");
          else if(minutes > 59) toast.error("Minutes must be less than 60");
          else {
            let totalSeconds = parseInt(days || 0) * 86400 + parseInt(hours || 0) * 3600 + parseInt(minutes || 0) * 60;
            let totalMinutes = totalSeconds / 60;
            if(totalMinutes <= 120) {
              setCycles(totalMinutes);
              setFrequency(60);
              closePopup();
            } else if(totalMinutes > 120 && totalMinutes <= 360) {
              setCycles(totalMinutes/2);
              setFrequency(60*2);
              closePopup();
            } else if(totalMinutes > 360 && totalMinutes <= 720) {
              setCycles(totalMinutes/3);
              setFrequency(60*3);
              closePopup();
            } else if(totalMinutes > 720 && totalMinutes <= 1440) {
              setCycles(totalMinutes/5);
              setFrequency(60*5);
              closePopup();
            } else if(totalMinutes > 1440) {
              setCycles(totalMinutes/10);
              setFrequency(60*10);
              closePopup();
            } else if(totalMinutes > 1440 * 7) {
              setCycles(totalMinutes/60);
              setFrequency(60*60);
              closePopup();
            }
          }
        }}>Save</Button>
      </div>
    </DialogContent>
  </Dialog>
}