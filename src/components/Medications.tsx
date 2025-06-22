import React, { useEffect, useState } from "react"

import { supabase } from "../supabase"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
}

const Medications: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([])
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showList, setShowList] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedMedication, setEditedMedication] = useState<Partial<Medication>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMedications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("medications")
      .select("id, name, dosage, frequency")
      .eq("user_id", user.id)
      .order("name")

    if (!error && data) {
      setMedications(data)
    }
  }

  const handleViewToggle = async () => {
    if (!showList) {
      await fetchMedications()
    }
    setShowList(!showList)
  }

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      setErrorMessage("All fields are required.")
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage("User not logged in.")
      return
    }

    const { error } = await supabase
      .from("medications")
      .insert([{ user_id: user.id, name, dosage, frequency }])
      .select()
      .single()

    if (!error) {
      setName('')
      setDosage('')
      setFrequency('')
      setErrorMessage('')
      setSuccessMessage("Medication added successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
      fetchMedications()
    } else {
      setErrorMessage("Failed to add medication. Please try again.")
    }
  }

  const handleUpdateMedication = async (id: string) => {
    if (!editedMedication.name?.trim() || !editedMedication.dosage?.trim() || !editedMedication.frequency?.trim()) return

    const { error } = await supabase
      .from("medications")
      .update({
        name: editedMedication.name,
        dosage: editedMedication.dosage,
        frequency: editedMedication.frequency,
      })
      .eq("id", id)

    if (!error) {
      setEditingId(null)
      setEditedMedication({})
      fetchMedications()
    }
  }

  const handleDeleteMedication = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this medication?")
    if (!confirmDelete) return

    const { error } = await supabase.from("medications").delete().eq("id", id)

    if (!error) {
      fetchMedications()
    }
  }

  return (
    <>
      <form onSubmit={handleAddMedication} className="w-full space-y-3 mb-6">
        <Input
          type="text"
          placeholder="Medication Name"
          className="w-full px-4 py-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Dosage"
          className="w-full px-4 py-2 border rounded"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Frequency (e.g. Once/day)"
          className="w-full px-4 py-2 border rounded"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          required
        />
        <Button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Add Medication
        </Button>
        {successMessage && (
          <div className=" w-full mb-4 p-3 text-center rounded bg-green-100 text-green-800 border border-green-300">
            {successMessage}
          </div>
        )}
      </form>

      <Button
        onClick={handleViewToggle}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
      >
        {showList ? "Hide List" : "View Added Medications"}
      </Button>

      {showList && (
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Search medication..."
            className="w-full px-3 py-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {medications
            .filter((m) => (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
            .map((med) => (
              <div key={med.id} className="p-4 bg-gray-100 rounded shadow space-y-2">
                {editingId === med.id ? (
                  <>
                    <input
                      type="text"
                      value={editedMedication.name || ''}
                      onChange={(e) => setEditedMedication({ ...editedMedication, name: e.target.value })}
                      className="w-full px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={editedMedication.dosage || ''}
                      onChange={(e) => setEditedMedication({ ...editedMedication, dosage: e.target.value })}
                      className="w-full px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={editedMedication.frequency || ''}
                      onChange={(e) => setEditedMedication({ ...editedMedication, frequency: e.target.value })}
                      className="w-full px-2 py-1 border rounded"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateMedication(med.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">{med.name}</div>
                    <div className="text-sm text-gray-700">Dosage: {med.dosage}</div>
                    <div className="text-sm text-gray-700">Frequency: {med.frequency}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingId(med.id)
                          setEditedMedication(med)
                        }}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </>
  )
}

export default Medications;
