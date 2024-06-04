import { useState } from "react";

import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const ThemesPage = () => {
  const [marketName, setMarketName] = useState("");
  const [baseMint, setBaseMint] = useState("");
  const [quoteMint, setQuoteMint] = useState("");
  const [minOrderSize, setMinOrderSize] = useState("");
  const [tickSize, setTickSize] = useState("");
  const [creatingMarket, setCreatingMarket] = useState(false);
  const [localMarkets, setLocalMarkets] = useState([]);
  
  const handleSubmit = (value, setterFunction) => {
    // Handle submission logic here
    console.log(value); // For demonstration
    setterFunction(value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    // Handle file upload logic here
    console.log(file); // For demonstration
  };

  return (
    <div className="flex flex-col items-center h-full w-full px-2 md:px-4 gap-4">
      <Header path={"/themes"} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl text-white font-bold">UI Themes</h1>
        <p className="text-sm text-muted-foreground text-center">
          Ideas and concepts for customizing the UI client-side
        </p>
      </div>
      <div className="w-full flex flex-col mt-4 gap-4 max-w-96 border p-4 bg-background rounded-lg">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
           <span className="space-x-44"><Label>Background Color </Label> <ThemeToggle /></span>
            <p className="text-xs text-muted-foreground">
              Set the default background color.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Input value={marketName} onChange={(e) => setMarketName(e.target.value)} className="rounded-md h-12 bg-background" placeholder="#FFFFFF" />
            <Button type="button" variant={"default"} className="h-12 bg-accent hover:bg-secondary-foreground" onClick={() => handleSubmit(marketName, setMarketName)}>
              Submit
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label>Border Color</Label>
            <p className="text-xs text-muted-foreground">
              Set the default border color.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Input value={baseMint} onChange={(e) => setBaseMint(e.target.value)} className="rounded-md h-12 bg-background" placeholder="#FFFFFF" />
            <Button type="button" variant={"default"} className="h-12 bg-accent hover:bg-secondary-foreground" onClick={() => handleSubmit(baseMint, setBaseMint)}>
              Submit
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label>Button Color</Label>
            <p className="text-xs text-muted-foreground">
              Set the default button color.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Input value={quoteMint} onChange={(e) => setQuoteMint(e.target.value)} className="rounded-md h-12 bg-background" placeholder="#FFFFFF" />
            <Button type="button" variant={"default"} className="h-12 bg-accent hover:bg-secondary-foreground" onClick={() => handleSubmit(quoteMint, setQuoteMint)}>
              Submit
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label>Font</Label>
            <p className="text-xs text-muted-foreground">
              Set the default font for the app.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Input type="number" value={minOrderSize} onChange={(e) => setMinOrderSize(e.target.value)} className="rounded-md h-12 bg-background" placeholder="Inter" />
            <Button type="button" variant={"default"} className="h-12 bg-accent hover:bg-secondary-foreground" onClick={() => handleSubmit(minOrderSize, setMinOrderSize)}>
              Submit
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label>Logo Image</Label>
            <p className="text-xs text-muted-foreground">
              Upload a custom logo from your device for your local browser.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input type="file" onChange={handleFileUpload} accept="image/*" className="rounded-md h-12 bg-background" />
            <Button type="button" variant={"default"} className="h-12 bg-accent hover:bg-secondary-foreground" onClick={handleFileUpload}>
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemesPage;
