import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/api';
import { format } from 'date-fns';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportService.getById(id)
  });

  if (isLoading) return <div className="loading">Loading...</div>;

  const report = data?.data?.report;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Report Details</h1>
      </div>
      <div className="report-detail">
        <div className="detail-section">
          <h2>Basic Information</h2>
          <div className="detail-grid">
            <div>
              <label>Report Number</label>
              <p>{report?.report_number}</p>
            </div>
            <div>
              <label>Incident Type</label>
              <p>{report?.incident_type}</p>
            </div>
            <div>
              <label>Status</label>
              <p>{report?.status}</p>
            </div>
            <div>
              <label>Date</label>
              <p>{format(new Date(report?.incident_date || report?.created_at), 'PPpp')}</p>
            </div>
            {report?.address && (
              <div>
                <label>Location</label>
                <p>{report.address}</p>
              </div>
            )}
          </div>
        </div>

        {report?.custom_fields && Object.keys(report.custom_fields).length > 0 && (
          <div className="detail-section">
            <h2>Additional Information</h2>
            <div className="detail-grid">
              {Object.entries(report.custom_fields).map(([key, value]) => (
                <div key={key}>
                  <label>{key}</label>
                  <p>{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {report?.photos && report.photos.length > 0 && (
          <div className="detail-section">
            <h2>Photos ({report.photos.length})</h2>
            <div className="photos-grid">
              {report.photos.map((photo) => (
                <img key={photo.id} src={photo.file_url} alt="Report photo" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

