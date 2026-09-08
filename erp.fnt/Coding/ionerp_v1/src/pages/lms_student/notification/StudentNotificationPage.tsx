import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  StudentNotificationItem,
  getNotificationBuckets,
  markNotificationRead,
} from "./studentNotificationService";

type NotificationTab = "unread" | "read";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const formatSentOn = (value: string) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StudentNotificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotificationTab>("unread");
  const [unreadNotifications, setUnreadNotifications] = useState<StudentNotificationItem[]>([]);
  const [readNotifications, setReadNotifications] = useState<StudentNotificationItem[]>([]);
  const [counts, setCounts] = useState({ unreadCount: 0, readCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await getNotificationBuckets();
      setUnreadNotifications(response.unread);
      setReadNotifications(response.read);
      setCounts(response.counts);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load student notifications";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, pageSize]);

  const currentRows = activeTab === "unread" ? unreadNotifications : readNotifications;

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return currentRows;
    }

    return currentRows.filter((item) =>
      [item.notice, item.fileName, item.sender, formatSentOn(item.sentOn)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [currentRows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startEntry = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, filteredRows.length);

  const toggleExpanded = (notificationId: number) => {
    setExpandedIds((current) =>
      current.includes(notificationId)
        ? current.filter((item) => item !== notificationId)
        : [...current, notificationId]
    );
  };

  const syncNotificationReadState = (notificationId: number) => {
    setUnreadNotifications((currentUnread) => {
      const matchedNotification = currentUnread.find((item) => item.id === notificationId);
      if (!matchedNotification) {
        return currentUnread;
      }

      const updatedItem = { ...matchedNotification, isRead: true };
      setReadNotifications((currentRead) =>
        [updatedItem, ...currentRead].sort(
          (left, right) =>
            new Date(right.sentOn || "").getTime() - new Date(left.sentOn || "").getTime()
        )
      );
      setCounts((currentCounts) => ({
        unreadCount: Math.max(0, currentCounts.unreadCount - 1),
        readCount: currentCounts.readCount + 1,
        totalCount: currentCounts.totalCount,
      }));

      return currentUnread.filter((item) => item.id !== notificationId);
    });
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setMarkingId(notificationId);
      await markNotificationRead(notificationId);
      syncNotificationReadState(notificationId);
      toast.success("Notification marked as read.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark notification as read";
      toast.error(message);
    } finally {
      setMarkingId(null);
    }
  };

  const handleOpenFile = async (item: StudentNotificationItem) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, "_blank", "noopener,noreferrer");
    }

    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Received Notification List</h1>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("unread")}
                className={`px-4 py-2 rounded-t-md text-sm font-medium border-b-2 ${
                  activeTab === "unread"
                    ? "bg-[#1f3a4f] text-white border-[#1f3a4f]"
                    : "bg-gray-100 text-gray-600 border-transparent"
                }`}
              >
                Unread Announcement
                {counts.unreadCount > 0 && (
                  <span className="ml-2 inline-flex min-w-[22px] justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] text-white">
                    {counts.unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("read")}
                className={`px-4 py-2 rounded-t-md text-sm font-medium border-b-2 ${
                  activeTab === "read"
                    ? "bg-[#1f3a4f] text-white border-[#1f3a4f]"
                    : "bg-gray-100 text-gray-600 border-transparent"
                }`}
              >
                Read Announcement
              </button>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              className="px-3 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#d6dde3] text-gray-700">
                <tr>
                  <th className="px-3 py-2">Sl No.</th>
                  <th className="px-3 py-2">Notice</th>
                  <th className="px-3 py-2">File Name</th>
                  <th className="px-3 py-2">Sent On</th>
                  <th className="px-3 py-2">Sender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      Loading notifications...
                    </td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-red-500">
                      {errorMessage}
                    </td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((item, index) => {
                    const isExpanded = expandedIds.includes(item.id);
                    const shouldTruncate = item.notice.length > 140;
                    const noticeText =
                      shouldTruncate && !isExpanded
                        ? `${item.notice.slice(0, 140)}...`
                        : item.notice;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 align-top">
                        <td className="px-3 py-3">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-3 py-3 min-w-[320px]">
                          <div className={item.isRead ? "text-gray-700" : "text-gray-900 font-medium"}>
                            {noticeText}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {shouldTruncate && (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(item.id)}
                                className="text-xs text-[#1f3a4f] hover:underline"
                              >
                                {isExpanded ? "Show Less" : "Show More"}
                              </button>
                            )}
                            {!item.isRead && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(item.id)}
                                disabled={markingId === item.id}
                                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                              >
                                {markingId === item.id ? "Marking..." : "Mark as Read"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 min-w-[220px]">
                          {item.fileName ? (
                            <button
                              type="button"
                              onClick={() => handleOpenFile(item)}
                              className="text-blue-600 hover:underline break-all text-left"
                            >
                              {`View File (${item.fileName})`}
                            </button>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{formatSentOn(item.sentOn)}</td>
                        <td className="px-3 py-3">{item.sender || "System"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 text-sm text-gray-600">
            <span>
              Showing {startEntry} to {endEntry} of {filteredRows.length} entries
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotificationPage;
