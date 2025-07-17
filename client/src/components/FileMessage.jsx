import React from 'react';
import { Download, File, Image, FileText, Music, Video, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

const FileMessage = ({ file, caption, timestamp, sender }) => {
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimetype.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimetype.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimetype.includes('pdf') || mimetype.includes('text')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    window.open(`http://localhost:5000/api/download/${file.filename}`, '_blank');
  };

  const handleView = () => {
    window.open(`http://localhost:5000${file.url}`, '_blank');
  };

  const isImage = file.mimetype.startsWith('image/');
  const isPDF = file.mimetype.includes('pdf');
  const isViewable = isImage || isPDF;

  return (
    <div className="max-w-sm">
      {isImage ? (
        <div className="mb-2">
          <img
            src={`http://localhost:5000${file.url}`}
            alt={file.originalName}
            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleView}
            style={{ maxHeight: '300px' }}
          />
        </div>
      ) : (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border mb-2">
          <div className="text-blue-500">
            {getFileIcon(file.mimetype)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={file.originalName}>
              {file.originalName}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
      )}

      {caption && (
        <p className="text-sm text-gray-700 mb-2">{caption}</p>
      )}

      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex items-center space-x-1"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </Button>
        
        {isViewable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>View</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileMessage;
