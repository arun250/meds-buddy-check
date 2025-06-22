import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Check, Calendar as CalendarIcon, User } from "lucide-react";
import MedicationTracker from "./MedicationTracker";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { supabase } from "../supabase";
import { useMemo } from "react";

const PatientDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [takenDates, setTakenDates] = useState<Set<string>>(new Set());
  const [medicationId, setMedicationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const isTodaySelected = isToday(selectedDate);
  const isSelectedDateTaken = takenDates.has(selectedDateStr);

  // Fetch medication + logs on mount
  useEffect(() => {

    const fetchOrCreateMedication = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        console.error("User not found");
        return;
      }
  
      setUserId(userId);
  
      // 1. Try to fetch any existing medication (limit 1)
      const { data: meds, error } = await supabase
        .from("medications")
        .select("id, date_taken")
        .eq("user_id", userId)
        .limit(1);
  
      if (error) {
        console.error("Failed to fetch medication:", error.message);
        return;
      }
  
      let medicationIdToUse;
  
      if (meds && meds.length > 0) {
        const existingMedication = meds[0];
        medicationIdToUse = existingMedication.id;
        setMedicationId(existingMedication.id);
      } else {
        // 2. Insert new medication if none exists
        const { data: inserted, error: insertError } = await supabase
          .from("medications")
          .insert([{ user_id: userId }])
          .select()
          .single();
  
        if (insertError || !inserted) {
          console.error("Failed to create new medication:", insertError?.message);
          return;
        }
  
        medicationIdToUse = inserted.id;
        setMedicationId(inserted.id);
      }
  
      // 3. Fetch logs
      const { data: logs, error: logsError } = await supabase
        .from("medication_log") 
        .select("date_taken")
        .eq("user_id", userId)
        .eq("medication_id", medicationIdToUse);
  
      if (logsError) {
        console.error("Error fetching logs:", logsError.message);
        return;
      }
  
      const takenSet = new Set(logs.map((log) => log.date_taken));
      setTakenDates(takenSet);
    };
  
    fetchOrCreateMedication();
    // realtime logic
    if (!medicationId || !userId) return;

    const channel = supabase.channel('medication-log-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'medication_log',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newDate = payload.new.date_taken;
          setTakenDates((prev) => new Set(prev).add(newDate));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    }
    //
  }, [userId,medicationId]);
  

  //  Mark as taken handler
  const handleMarkTaken = async (date: string, imageFile?: File) => {
    if (!medicationId || !userId) return;

    const { data: existing, error: checkError } = await supabase
      .from("medication_log") 
      .select("id")
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .eq("date_taken", date)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking logs:", checkError.message);
      return;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from("medication_log")
        .insert([{ user_id: userId, medication_id: medicationId, date_taken: date}]);

      if (insertError) {
        console.error("Error inserting log:", insertError.message);
        return;
      }

      //const updated = new Set(takenDates);
      //updated.add(date);
      //setTakenDates(updated);
      const { data: logs, error: logsError } = await supabase
      .from("medication_log")
      .select("date_taken")
      .eq("user_id", userId)
      .eq("medication_id", medicationId);
  
    if (logsError) {
      console.error("Error fetching updated logs:", logsError.message);
      return;
    }
  
    const updatedSet = new Set(logs.map((log) => log.date_taken));
      setTakenDates(updatedSet);
      //

      if (imageFile) {
        console.log("Proof image uploaded:", imageFile.name);
      }
    }
  };

  // Calculate streak
 

  const streakCount = useMemo(() => {
    let streak = 0;
    let current = new Date(today);
  
    while (takenDates.has(format(current, "yyyy-MM-dd")) && streak < 30) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
  
    return streak;
  }, [takenDates]);
  
  const monthlyRate = useMemo(() => {
    return Math.round((takenDates.size / 30) * 100);
  }, [takenDates]);
  
  //
  
  
  return (
    <div className="space-y-6">
      {/* Welcome + Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}!
            </h2>
            <p className="text-white/90 text-lg">Ready to stay on track with your medication?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{streakCount}</div>
            <div className="text-white/80">Day Streak</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{takenDates.has(todayStr) ? "✓" : "○"}</div>
            <div className="text-white/80">Today's Status</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{monthlyRate}%</div>
            <div className="text-white/80">Monthly Rate</div>
          </div>
        </div>
      </div>

      {/* Medication + Calendar */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                {isTodaySelected
                  ? "Today's Medication"
                  : `Medication for ${format(selectedDate, "MMMM d, yyyy")}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicationId && userId && (
                <MedicationTracker
                  date={selectedDateStr}
                  isTaken={isSelectedDateTaken}
                  onMarkTaken={handleMarkTaken}
                  isToday={isTodaySelected}
                  medicationId={medicationId}
                  userId={userId}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Medication Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full"
                modifiersClassNames={{
                  selected: "bg-blue-600 text-white hover:bg-blue-700",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const taken = takenDates.has(dateStr);
                    const past = isBefore(date, startOfDay(today));
                    const current = isToday(date);

                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        {taken && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {!taken && past && !current && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full"></div>
                        )}
                      </div>
                    );
                  },
                }}
              />

              {/* Legend */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Medication taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Missed medication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
