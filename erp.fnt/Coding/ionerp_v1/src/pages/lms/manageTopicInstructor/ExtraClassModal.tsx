import React, { useState } from "react";
import { useTopicService } from "./topicService";

import { toast } from "react-toastify";

interface ExtraClassModalProps {
  mapping_id: number;
  close: () => void;
  refresh: () => void;
}

// Modal component for adding an extra class to a topic
export default function ExtraClassModal({ mapping_id, close, refresh }: ExtraClassModalProps) {
  const topicService = useTopicService();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const addExtraClass = async () => {
    if (!date) {
      toast("Please select a date");
      return;
    }

    setLoading(true);
    try {
      await topicService.addExtraClass({
        mapping_id: mapping_id,
        class_date: date,
        notes: notes
      });
      toast("Extra class added successfully");
      refresh();
      close();
    } catch (error) {
      console.error("Error adding extra class:", error);
      toast("Error adding extra class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Extra Class</h5>
            <button type="button" className="btn-close" onClick={close}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={close}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={addExtraClass}
              disabled={!date || loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}