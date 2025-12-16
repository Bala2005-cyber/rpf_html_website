class LocalStorageService {
  constructor() {
    this.storageKey = 'rfp_data';
    this.fileStorageKey = 'rfp_files';
  }

  // Get all RFPs from local storage
  getRFPs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  // Convert file to base64 and save
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Save RFP to local storage
  async saveRFP(rfpData) {
    try {
      const rfps = this.getRFPs();
      let fileData = null;
      let fileName = null;
      let fileSize = null;

      if (rfpData.file) {
        // Convert file to base64 for storage
        fileData = await this.fileToBase64(rfpData.file);
        fileName = rfpData.file.name;
        fileSize = rfpData.file.size;
      }

      const newRFP = {
        ...rfpData,
        _id: Date.now().toString(), // Generate unique ID
        uploadedAt: new Date().toISOString(),
        fileData: fileData, // Store base64 data
        fileName: fileName,
        fileSize: fileSize
      };
      
      // Remove the actual file object before storing
      delete newRFP.file;
      
      rfps.push(newRFP);
      localStorage.setItem(this.storageKey, JSON.stringify(rfps));
      return newRFP;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }

  // Get file URL from base64 data
  getFileUrl(base64Data) {
    if (!base64Data) return null;
    
    // Convert base64 back to blob URL for immediate loading
    try {
      const byteCharacters = atob(base64Data.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return base64Data; // Fallback to base64
    }
  }

  // Get download URL for file
  getDownloadUrl(base64Data, fileName) {
    if (!base64Data) return null;
    
    try {
      const byteCharacters = atob(base64Data.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating download URL:', error);
      return base64Data; // Fallback to base64
    }
  }

  // Update RFP in local storage
  updateRFP(rfpId, updateData) {
    try {
      const rfps = this.getRFPs();
      const index = rfps.findIndex(rfp => rfp._id === rfpId);
      
      if (index !== -1) {
        rfps[index] = { ...rfps[index], ...updateData };
        localStorage.setItem(this.storageKey, JSON.stringify(rfps));
        return rfps[index];
      }
      throw new Error('RFP not found');
    } catch (error) {
      console.error('Error updating RFP:', error);
      throw error;
    }
  }

  // Delete RFP from local storage
  deleteRFP(rfpId) {
    try {
      const rfps = this.getRFPs();
      const filteredRfps = rfps.filter(rfp => rfp._id !== rfpId);
      
      if (filteredRfps.length < rfps.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(filteredRfps));
        return true;
      }
      throw new Error('RFP not found');
    } catch (error) {
      console.error('Error deleting RFP:', error);
      throw error;
    }
  }

  // Get RFPs filtered by status
  getRFPsByStatus(status) {
    const rfps = this.getRFPs();
    const now = new Date();
    
    return rfps.filter(rfp => {
      const deadline = new Date(rfp.deadline);
      
      switch (status) {
        case 'recent':
          return true; // All recent RFPs
        case 'completed':
          return deadline < now;
        case 'extended':
          return rfp.status === 'extended';
        default:
          return true;
      }
    });
  }

  // Search RFPs
  searchRFPs(searchTerm) {
    const rfps = this.getRFPs();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return rfps.filter(rfp => 
      rfp.projectName.toLowerCase().includes(lowerSearchTerm) ||
      rfp.productSummary.toLowerCase().includes(lowerSearchTerm) ||
      rfp.status.toLowerCase().includes(lowerSearchTerm)
    );
  }
}

export default new LocalStorageService();
