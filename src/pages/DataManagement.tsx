import { useState, useRef } from "react";
import { useDatabase } from "../context/DatabaseContext";
import {
  exportAllData,
  downloadAsJson,
  getExportSummary,
} from "../utils/dataExport";
import {
  importData,
  readJsonFile,
  validateImportData,
  type ImportOptions,
  type ImportResult,
} from "../utils/dataImport";

export function DataManagement() {
  const { isReady, initError, getAll, create, clearStore } = useDatabase();
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import options
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [validateData, setValidateData] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);
    // Clear previous results when starting new export
    setExportStatus("Exporting database...");
    setImportStatus(null);
    setImportResult(null);

    try {
      const exportData = await exportAllData(getAll);
      downloadAsJson(exportData);

      const summary = getExportSummary(exportData);
      setExportStatus(`✅ ${summary}`);
    } catch (error) {
      setExportStatus(
        `❌ Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearFileSelection();
      return;
    }

    // Clear previous results when selecting new file
    setImportStatus("Reading and validating file...");
    setImportResult(null);
    setExportStatus(null);

    try {
      // Read and validate file
      const data = await readJsonFile(file);
      const validation = validateImportData(data);

      setSelectedFile(file);
      setFileData(data);
      setValidationResult(validation);

      if (validation.isValid) {
        setImportStatus("✅ File is valid and ready to import");
      } else {
        setImportStatus(
          `❌ Validation failed: ${validation.errors.join(", ")}`,
        );
      }
    } catch (error) {
      setImportStatus(
        `❌ Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      clearFileSelection();
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFileData(null);
    setValidationResult(null);
    setImportStatus(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateBackup = async () => {
    if (!isReady) return;

    setImportStatus("Creating backup...");
    try {
      const backupData = await exportAllData(getAll);
      downloadAsJson(
        backupData,
        `backup_before_import_${new Date().toISOString().split("T")[0]}.json`,
      );
      setImportStatus("✅ Backup created successfully");
    } catch (error) {
      setImportStatus(
        `❌ Backup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleImportData = async () => {
    if (!fileData || !validationResult?.isValid) return;

    setIsImporting(true);
    // Clear previous results when starting new import
    setImportStatus("Importing data...");
    setImportResult(null);
    setExportStatus(null);

    try {
      const options: ImportOptions = {
        skipDuplicates,
        validateData,
        createBackup: false, // We handle backup separately now
      };

      const result = await importData(fileData as any, options, {
        getAll,
        create,
        clearStore,
      });

      setImportResult(result);
      setImportStatus(
        result.success ? "✅ Import completed" : "❌ Import failed",
      );

      // Keep results visible - don't auto-clear
    } catch (error) {
      setImportStatus(
        `❌ Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  if (!isReady && !initError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading database...</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Database Error
        </h2>
        <p className="text-red-600">{initError}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Management</h1>
      <p className="text-gray-600 mb-8">
        Export your data for backup or import data from previous exports. All
        operations include validation and safety checks.
      </p>

      {/* Export Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Export Database</h2>
        <p className="text-gray-600 mb-4">
          Download all your data (users, skills, and relationships) as a JSON
          file for backup or transfer.
        </p>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? "Exporting..." : "Export All Data"}
        </button>

        {exportStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm">{exportStatus}</p>
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Import Database</h2>
        <p className="text-gray-600 mb-4">
          Import data from a previously exported JSON file. Configure options
          below to control the import behavior.
        </p>

        {/* Import Options */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Import Options
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Skip duplicate records
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={validateData}
                onChange={(e) => setValidateData(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Validate data before import
              </span>
            </label>
          </div>
        </div>

        {/* File Selection */}
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {/* Action Buttons - Show after file is selected and validated */}
          {selectedFile && validationResult?.isValid && (
            <div className="flex gap-3">
              <button
                onClick={handleCreateBackup}
                disabled={isImporting}
                className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Backup First
              </button>
              <button
                onClick={handleImportData}
                disabled={isImporting}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? "Importing..." : "Import Data"}
              </button>
              <button
                onClick={clearFileSelection}
                disabled={isImporting}
                className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {importStatus && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">{importStatus}</p>
          </div>
        )}

        {importResult && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Import Results
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600">✅ Imported:</p>
                <ul className="ml-4 text-gray-600">
                  <li>• {importResult.imported.users} users</li>
                  <li>• {importResult.imported.skills} skills</li>
                  <li>• {importResult.imported.userSkills} user skills</li>
                </ul>
              </div>
              <div>
                <p className="text-yellow-600">⏭️ Skipped:</p>
                <ul className="ml-4 text-gray-600">
                  <li>• {importResult.skipped.users} users</li>
                  <li>• {importResult.skipped.skills} skills</li>
                  <li>• {importResult.skipped.userSkills} user skills</li>
                </ul>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-red-600 text-sm font-medium">Errors:</p>
                <ul className="ml-4 text-red-600 text-sm">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          ⚠️ Important Notes
        </h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Exports include all data with timestamps and metadata</li>
          <li>
            • Import operations can add new records but won't modify existing
            ones
          </li>
          <li>
            • Backups are automatically created before imports when enabled
          </li>
          <li>• Large datasets may take time to process - please be patient</li>
          <li>• Always verify your data after import operations</li>
        </ul>
      </div>
    </div>
  );
}
