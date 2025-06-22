import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Image, Camera, Clock } from "lucide-react";
import { format } from "date-fns";

import { supabase } from "../supabase";

import Medications from "./Medications";

interface MedicationTrackerProps {
  date: string;
  isTaken: boolean;
  onMarkTaken: (date: string, imageFile?: File) => void;
  isToday: boolean;
  medicationId: string;
  userId: string;
}

const MedicationTracker = ({ date, onMarkTaken, isToday, medicationId, userId, isTaken }: MedicationTrackerProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dateTakenList, setDateTakenList] = useState<string[]>([]);

  useEffect(() => {
    const fetchDates = async () => {
      if (!medicationId) return;

      const { data, error } = await supabase
        .from("medication_log")
        .select("date_taken")
        .eq("user_id", userId)
        .eq("medication_id", medicationId);

      if (error) {
        console.error("Failed to fetch dates:", error.message);
        return;
      }

      setDateTakenList(data?.map((entry) => entry.date_taken) || []);
    };

    fetchDates();
  }, [medicationId, userId]);

  const dailyMedication = {
    name: "Daily Medication Set",
    time: "8:00 AM",
    description: "Complete set of daily tablets",
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkTaken = async () => {
    if (!isToday || !medicationId) return;

    const today = new Date().toISOString().split("T")[0];

    if (dateTakenList.includes(today)) {
      console.log("Already marked as taken today");
      return;
    }

    // Image Upload
    let imageUrl = "";
    if (selectedImage) {
      const fileName = `private/${medicationId}-${today}.jpg`;


      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("medication-images")
        .upload(fileName, selectedImage, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Image upload failed:", uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("medication-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData?.publicUrl || "";
      }
    }

    // Insert log into medication_log
    const { error: insertError } = await supabase.from("medication_log").insert([
      {
        user_id: userId,
        medication_id: medicationId,
        date_taken: today,
        
      },
    ]);

    if (insertError) {
      console.error("Failed to insert log:", insertError.message);
      return;
    }

    setDateTakenList((prev) => [...prev, today]);
    setSelectedImage(null);
    setImagePreview(null);
    console.log("Marked as taken successfully");
    onMarkTaken(today, selectedImage || undefined);
  };

  isTaken = dateTakenList.includes(date);

  if (isTaken) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8 bg-green-50 rounded-xl border-2 border-green-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Medication Completed!</h3>
            <p className="text-green-600">
              Great job! You've taken your medication for {format(new Date(date), "MMMM d, yyyy")}.
            </p>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">{dailyMedication.name}</h4>
                <p className="text-sm text-green-600">{dailyMedication.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Clock className="w-3 h-3 mr-1" />
              {dailyMedication.time}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">1</span>
            </div>
            <div>
              <h4 className="font-medium">{dailyMedication.name}</h4>
              <p className="text-sm text-muted-foreground">{dailyMedication.description}</p>
            </div>
          </div>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {dailyMedication.time}
          </Badge>
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-center hover:shadow-md transition-shadow">
        <CardContent className="flex flex-col justify-between p-4">
          <h4 className="font-medium mb-2">Add Medication</h4>
          <Medications />
        </CardContent>
      </Card>

      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="p-6">
          <div className="text-center">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Add Proof Photo (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take a photo of your medication or pill organizer as confirmation
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-4"
            >
              <Camera className="w-4 h-4 mr-2" />
              {selectedImage ? "Change Photo" : "Take Photo"}
            </Button>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Medication proof"
                  className="max-w-full h-32 object-cover rounded-lg mx-auto border-2 border-border"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Photo selected: {selectedImage?.name}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleMarkTaken}
        className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
        disabled={!isToday}
      >
        <Check className="w-5 h-5 mr-2" />
        {isToday ? "Mark as Taken" : "Cannot mark future dates"}
      </Button>

      {!isToday && (
        <p className="text-center text-sm text-muted-foreground">
          You can only mark today's medication as taken
        </p>
      )}
    </div>
  );
};

export default MedicationTracker;
