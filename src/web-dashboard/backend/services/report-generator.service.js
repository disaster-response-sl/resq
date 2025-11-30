// Advanced Report Generation Service
const MissingPerson = require('../models/MissingPerson');
const SosSignal = require('../models/SosSignal');
const Disaster = require('../models/Disaster');
const Resource = require('../models/Resource');
const Donation = require('../models/Donation');
const Report = require('../models/Report');

class ReportGeneratorService {
  /**
   * Generate comprehensive report based on type and filters
   */
  async generateReport(config) {
    const {
      report_type,
      date_range = {},
      filters = {},
      include_charts = true,
      include_maps = false
    } = config;

    try {
      let reportData;

      switch (report_type) {
        case 'sos':
          reportData = await this.generateSOSReport(date_range, filters);
          break;
        case 'missing_persons':
          reportData = await this.generateMissingPersonsReport(date_range, filters);
          break;
        case 'disasters':
          reportData = await this.generateDisastersReport(date_range, filters);
          break;
        case 'resources':
          reportData = await this.generateResourcesReport(date_range, filters);
          break;
        case 'relief_ops':
          reportData = await this.generateReliefOpsReport(date_range, filters);
          break;
        case 'financial':
          reportData = await this.generateFinancialReport(date_range, filters);
          break;
        case 'comprehensive':
          reportData = await this.generateComprehensiveReport(date_range, filters);
          break;
        default:
          throw new Error(`Unknown report type: ${report_type}`);
      }

      // Add metadata
      reportData.metadata = {
        generated_at: new Date(),
        report_type,
        date_range,
        filters,
        include_charts,
        include_maps
      };

      return {
        success: true,
        data: reportData
      };

    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SOS Response Report
   */
  async generateSOSReport(date_range, filters) {
    const dateQuery = this.buildDateQuery(date_range);
    let query = { ...dateQuery };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;

    const signals = await SosSignal.find(query).sort({ created_at: -1 });

    // Calculate statistics
    const stats = {
      total_signals: signals.length,
      by_status: this.groupBy(signals, 'status'),
      by_priority: this.groupBy(signals, 'priority'),
      by_emergency_type: this.groupBy(signals, 'emergency_type'),
      external_count: signals.filter(s => s.external).length,
      avg_response_time: this.calculateAvgResponseTime(signals),
      resolution_rate: this.calculateResolutionRate(signals),
      geographic_distribution: this.groupByLocation(signals)
    };

    // Timeline data
    const timeline = this.createTimeline(signals, 'created_at');

    return {
      summary: stats,
      timeline,
      signals: signals.slice(0, 100), // Latest 100 for detailed view
      charts: {
        status_distribution: this.createChartData(stats.by_status),
        priority_distribution: this.createChartData(stats.by_priority),
        emergency_type_distribution: this.createChartData(stats.by_emergency_type)
      }
    };
  }

  /**
   * Missing Persons Report
   */
  async generateMissingPersonsReport(date_range, filters) {
    const dateQuery = this.buildDateQuery(date_range, 'created_at');
    let query = { ...dateQuery };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;

    const persons = await MissingPerson.find(query).sort({ created_at: -1 });

    const stats = {
      total_cases: persons.length,
      by_status: this.groupBy(persons, 'status'),
      by_priority: this.groupBy(persons, 'priority'),
      vulnerable_persons: persons.filter(p => p.is_vulnerable).length,
      disaster_related: persons.filter(p => p.disaster_related).length,
      found_rate: this.calculateFoundRate(persons),
      avg_time_to_resolution: this.calculateAvgResolutionTime(persons),
      sightings_reported: persons.reduce((sum, p) => sum + (p.sightings?.length || 0), 0)
    };

    return {
      summary: stats,
      cases: persons.slice(0, 50), // Latest 50 cases
      charts: {
        status_distribution: this.createChartData(stats.by_status),
        priority_distribution: this.createChartData(stats.by_priority),
        monthly_trend: this.createMonthlyTrend(persons, 'created_at')
      }
    };
  }

  /**
   * Disasters Report
   */
  async generateDisastersReport(date_range, filters) {
    const dateQuery = this.buildDateQuery(date_range, 'timestamp');
    let query = { ...dateQuery };

    if (filters.type) query.type = filters.type;
    if (filters.severity) query.severity = filters.severity;
    if (filters.status) query.status = filters.status;

    const disasters = await Disaster.find(query).sort({ timestamp: -1 });

    const stats = {
      total_disasters: disasters.length,
      by_type: this.groupBy(disasters, 'type'),
      by_severity: this.groupBy(disasters, 'severity'),
      by_status: this.groupBy(disasters, 'status'),
      by_priority: this.groupBy(disasters, 'priority_level'),
      total_affected: disasters.reduce((sum, d) => {
        return sum + (d.zones?.reduce((zSum, z) => zSum + (z.estimated_population || 0), 0) || 0);
      }, 0),
      total_area_affected: disasters.reduce((sum, d) => {
        return sum + (d.zones?.reduce((zSum, z) => zSum + (z.area_km2 || 0), 0) || 0);
      }, 0),
      resources_required: this.aggregateResources(disasters)
    };

    return {
      summary: stats,
      disasters: disasters.slice(0, 50),
      charts: {
        type_distribution: this.createChartData(stats.by_type),
        severity_distribution: this.createChartData(stats.by_severity),
        monthly_trend: this.createMonthlyTrend(disasters, 'timestamp')
      }
    };
  }

  /**
   * Resources Report
   */
  async generateResourcesReport(date_range, filters) {
    let query = {};

    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;

    const resources = await Resource.find(query);

    const stats = {
      total_resources: resources.length,
      by_type: this.groupBy(resources, 'type'),
      by_category: this.groupBy(resources, 'category'),
      by_status: this.groupBy(resources, 'status'),
      total_quantity: resources.reduce((sum, r) => sum + (r.quantity?.current || 0), 0),
      allocated_quantity: resources.reduce((sum, r) => sum + (r.quantity?.allocated || 0), 0),
      available_quantity: resources.reduce((sum, r) => sum + (r.quantity?.current - r.quantity?.allocated || 0), 0),
      critical_resources: resources.filter(r => r.priority === 'critical').length,
      depleted_resources: resources.filter(r => r.status === 'depleted').length,
      allocation_rate: this.calculateAllocationRate(resources)
    };

    return {
      summary: stats,
      resources: resources.slice(0, 100),
      charts: {
        type_distribution: this.createChartData(stats.by_type),
        status_distribution: this.createChartData(stats.by_status),
        allocation_trend: this.createAllocationTrend(resources)
      }
    };
  }

  /**
   * Relief Operations Report
   */
  async generateReliefOpsReport(date_range, filters) {
    const dateQuery = this.buildDateQuery(date_range);
    
    const reports = await Report.find(dateQuery).sort({ timestamp: -1 });

    const stats = {
      total_reports: reports.length,
      by_type: this.groupBy(reports, 'type'),
      by_status: this.groupBy(reports, 'status'),
      by_priority: this.groupBy(reports, 'priority'),
      total_affected: reports.reduce((sum, r) => sum + (r.affected_people || 0), 0),
      resources_needed: this.aggregateReportResources(reports),
      geographic_coverage: this.groupByLocation(reports)
    };

    return {
      summary: stats,
      reports: reports.slice(0, 100),
      charts: {
        type_distribution: this.createChartData(stats.by_type),
        status_distribution: this.createChartData(stats.by_status),
        daily_trend: this.createDailyTrend(reports, 'timestamp')
      }
    };
  }

  /**
   * Financial Report
   */
  async generateFinancialReport(date_range, filters) {
    const dateQuery = this.buildDateQuery(date_range, 'createdAt');
    let query = { ...dateQuery, status: 'SUCCESS' };

    const donations = await Donation.find(query).populate('donor').sort({ createdAt: -1 });

    const stats = {
      total_donations: donations.length,
      total_amount: donations.reduce((sum, d) => sum + d.amount, 0),
      average_donation: donations.length > 0 ? donations.reduce((sum, d) => sum + d.amount, 0) / donations.length : 0,
      by_currency: this.groupBy(donations, 'currency'),
      by_payment_method: this.groupBy(donations, 'paymentMethod'),
      unique_donors: new Set(donations.map(d => d.donor?._id)).size,
      peak_donation_time: this.findPeakTimes(donations),
      monthly_trend: this.createMonthlyTrend(donations, 'createdAt')
    };

    return {
      summary: stats,
      donations: donations.slice(0, 100),
      charts: {
        monthly_trend: this.createChartData(stats.monthly_trend),
        payment_method_distribution: this.createChartData(stats.by_payment_method)
      }
    };
  }

  /**
   * Comprehensive Report (All Systems)
   */
  async generateComprehensiveReport(date_range, filters) {
    const [sosReport, missingReport, disastersReport, resourcesReport, financialReport] = await Promise.all([
      this.generateSOSReport(date_range, filters),
      this.generateMissingPersonsReport(date_range, filters),
      this.generateDisastersReport(date_range, filters),
      this.generateResourcesReport(date_range, filters),
      this.generateFinancialReport(date_range, filters)
    ]);

    return {
      executive_summary: {
        total_sos_signals: sosReport.summary.total_signals,
        total_missing_persons: missingReport.summary.total_cases,
        total_disasters: disastersReport.summary.total_disasters,
        total_resources: resourcesReport.summary.total_resources,
        total_donations: financialReport.summary.total_amount,
        people_affected: disastersReport.summary.total_affected
      },
      sos_system: sosReport,
      missing_persons: missingReport,
      disasters: disastersReport,
      resources: resourcesReport,
      financial: financialReport,
      generated_at: new Date()
    };
  }

  // Helper Methods

  buildDateQuery(date_range, field = 'created_at') {
    const query = {};
    if (date_range.start || date_range.end) {
      query[field] = {};
      if (date_range.start) query[field].$gte = new Date(date_range.start);
      if (date_range.end) query[field].$lte = new Date(date_range.end);
    }
    return query;
  }

  groupBy(array, field) {
    return array.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  groupByLocation(array) {
    // Simple geographic grouping by rounding coordinates
    return array.reduce((acc, item) => {
      if (!item.location) return acc;
      const lat = Math.round(item.location.lat * 10) / 10;
      const lng = Math.round(item.location.lng * 10) / 10;
      const key = `${lat},${lng}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAvgResponseTime(signals) {
    const responded = signals.filter(s => s.response_time);
    if (responded.length === 0) return 0;
    
    const totalMinutes = responded.reduce((sum, s) => {
      const diff = new Date(s.response_time) - new Date(s.created_at);
      return sum + (diff / 1000 / 60); // Convert to minutes
    }, 0);
    
    return Math.round(totalMinutes / responded.length);
  }

  calculateResolutionRate(signals) {
    const resolved = signals.filter(s => s.status === 'resolved').length;
    return signals.length > 0 ? ((resolved / signals.length) * 100).toFixed(2) : 0;
  }

  calculateFoundRate(persons) {
    const found = persons.filter(p => p.status === 'found_safe' || p.status === 'found_deceased').length;
    return persons.length > 0 ? ((found / persons.length) * 100).toFixed(2) : 0;
  }

  calculateAvgResolutionTime(persons) {
    const resolved = persons.filter(p => p.found_date);
    if (resolved.length === 0) return 0;
    
    const totalHours = resolved.reduce((sum, p) => {
      const diff = new Date(p.found_date) - new Date(p.created_at);
      return sum + (diff / 1000 / 60 / 60); // Convert to hours
    }, 0);
    
    return Math.round(totalHours / resolved.length);
  }

  calculateAllocationRate(resources) {
    const allocated = resources.reduce((sum, r) => sum + (r.quantity?.allocated || 0), 0);
    const total = resources.reduce((sum, r) => sum + (r.quantity?.current || 0), 0);
    return total > 0 ? ((allocated / total) * 100).toFixed(2) : 0;
  }

  aggregateResources(disasters) {
    return disasters.reduce((acc, d) => {
      if (!d.resources_required) return acc;
      Object.keys(d.resources_required).forEach(key => {
        acc[key] = (acc[key] || 0) + (d.resources_required[key] || 0);
      });
      return acc;
    }, {});
  }

  aggregateReportResources(reports) {
    return reports.reduce((acc, r) => {
      if (!r.resource_requirements) return acc;
      Object.keys(r.resource_requirements).forEach(key => {
        acc[key] = (acc[key] || 0) + (r.resource_requirements[key] || 0);
      });
      return acc;
    }, {});
  }

  createTimeline(array, dateField) {
    const grouped = array.reduce((acc, item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(grouped).sort().map(date => ({
      date,
      count: grouped[date]
    }));
  }

  createMonthlyTrend(array, dateField) {
    const grouped = array.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(grouped).sort().map(month => ({
      month,
      count: grouped[month]
    }));
  }

  createDailyTrend(array, dateField) {
    return this.createTimeline(array, dateField);
  }

  createChartData(groupedData) {
    return Object.keys(groupedData).map(key => ({
      label: key,
      value: groupedData[key]
    }));
  }

  createAllocationTrend(resources) {
    // Group resources by creation date
    return this.createTimeline(resources, 'created_at');
  }

  findPeakTimes(donations) {
    const hourly = donations.reduce((acc, d) => {
      const hour = new Date(d.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    const sorted = Object.keys(hourly).sort((a, b) => hourly[b] - hourly[a]);
    return sorted.slice(0, 3).map(hour => ({ hour: parseInt(hour), donations: hourly[hour] }));
  }
}

module.exports = new ReportGeneratorService();
