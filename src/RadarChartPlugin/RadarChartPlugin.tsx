/*
Copyright 2005 - 2021 Advantage Solutions, s. r. o.

This file is part of ORIGAM (http://www.origam.org).

ORIGAM is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ORIGAM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ORIGAM. If not, see <http://www.gnu.org/licenses/>.
*/


import { observable } from "mobx";
import React from "react";
import S from './RadarChartPlugin.module.scss';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);
import moment from "moment";
import {
  ILocalization,
  ILocalizer,
  IPluginData,
  IPluginTableRow,
  ISectionPlugin
} from "@origam/plugin-interfaces";
import { csToMomentFormat } from "@origam/utils";

const seriesLabelFieldName = "SeriesLabelField";
const seriesValueFieldsName = "SeriesValueFields";
const filterFieldName = "FilterField";
const noDataMessageName = "NoDataMessage";
const axisMinName = "AxisMin";
const axisMaxName = "AxisMax";
const stepSizeName = "StepSize";
const labelFormatName = "LabelFormat";

export class RadarChartPlugin implements ISectionPlugin {
  $type_ISectionPlugin: 1 = 1;
  id: string = ""
  seriesValueFields: string | undefined;
  seriesLabelField: string | undefined;
  noDataMessage: string | undefined;
  filterField: string | undefined;
  axisMin: number | undefined;
  axisMax: number | undefined;
  stepSize: number | undefined;
  labelFormat: string | undefined;
  labels: string[] = [];

  @observable
  initialized = false;

  initialize(xmlAttributes: { [key: string]: string }): void {
    this.seriesValueFields = this.getXmlParameter(xmlAttributes, seriesValueFieldsName);
    this.seriesLabelField = this.getXmlParameter(xmlAttributes, seriesLabelFieldName);
    this.noDataMessage = this.getXmlParameter(xmlAttributes, noDataMessageName);
    this.filterField = xmlAttributes[filterFieldName];
    this.labelFormat = xmlAttributes[labelFormatName];
    this.axisMin = this.getPositiveNumericParameter(xmlAttributes, axisMinName);
    this.axisMax = this.getPositiveNumericParameter(xmlAttributes, axisMaxName);
    this.stepSize = this.getPositiveNumericParameter(xmlAttributes, stepSizeName);
    this.initialized = true;
  }

  getXmlParameter(xmlAttributes: { [key: string]: string }, parameterName: string) {
    if (!xmlAttributes[parameterName]) {
      throw new Error(`Parameter ${parameterName} was not found. Cannot plot anything.`)
    }
    return xmlAttributes[parameterName];
  }

  getPositiveNumericParameter(xmlAttributes: { [key: string]: string }, parameterName: string) {
    let value = xmlAttributes[parameterName];
    if (!value || value.trim() === "") {
      return undefined;
    }
    const number = Number(value);
    return (isNaN(number) || number < 0) ? undefined : number;
  }

  getLabel(data: IPluginData, row: IPluginTableRow): string {
    const property = this.getProperty(data, this.seriesLabelField!)

    let cellValue = data.dataView.getCellValue(row, property.id);
    if (property.type === "Date") {
      const format = csToMomentFormat(this.labelFormat) ?? property.momentFormatterPattern
      return moment(cellValue).format(format);
    } else {
      return (cellValue ?? "").toString();
    }
  }

  getUniqueLabel(data: IPluginData, row: IPluginTableRow) {
    let newLabel = this.getLabel(data, row);
    let numberOfDuplicates = this.labels.filter(label => label === newLabel).length;
    if (numberOfDuplicates > 0) {
      newLabel = `${newLabel}(${numberOfDuplicates})`;
    }
    this.labels.push(newLabel);
    return newLabel;
  }

  getProperty(data: IPluginData, propertyId: string) {
    const property = data.dataView.properties.find(prop => prop.id === propertyId)
    if (!property) {
      throw new Error(`Property ${propertyId} was not found`)
    }
    return property;
  }

  getComponent(data: IPluginData, createLocalizer: (localizations: ILocalization[]) => ILocalizer): JSX.Element {
    const localizer = createLocalizer([]);
    moment.locale(localizer.locale)

    if (!this.initialized) {
      return <></>;
    }

    const properties = this.seriesValueFields!
      .split(";")
      .map(propertyId => this.getProperty(data, propertyId.trim()))
    this.labels = [];
    const dataSets = data.dataView.tableRows
      .filter(row => !this.filterField || data.dataView.getCellValue(row, this.filterField))
      .map(row => {
        const index = data.dataView.tableRows.indexOf(row);
        const color = SeriesColor.getBySeriesNumber(index);
        return {
          label: this.getUniqueLabel(data, row), // it is important to make the labels unique, otherwise the Radar component throws reference exceptions. Probably a bug in react-chartjs-2
          data: properties.map(prop => data.dataView.getCellValue(row, prop.id)),
          backgroundColor: color.background,
          borderColor: color.border,
          borderWidth: 1,
        }
      })
    if (dataSets.length === 0) {
      return <div className={S.noDataMessageContainer}>{this.noDataMessage}</div>
    }
    return (
      <div className={S.chartContainer}>
        <Radar
          data={{
            labels: properties.map(prop => prop.name),
            datasets: dataSets,
          }}
          options={
            {
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: this.axisMin === 0,
                  suggestedMin: this.axisMin,
                  suggestedMax: this.axisMax,
                  ticks: {
                    stepSize: this.stepSize
                  }
                }
              }
            }
          }
        />
      </div>
    );
  }

  @observable
  getScreenParameters: (() => { [parameter: string]: string }) | undefined;
}


class SeriesColor {

  static seriesColorsRGB = [
    new SeriesColor(255, 99, 132),
    new SeriesColor(234, 99, 255),
    new SeriesColor(99, 112, 255),
    new SeriesColor(99, 252, 255),
    new SeriesColor(168, 164, 50),
    new SeriesColor(99, 255, 102),
    new SeriesColor(247, 161, 0),
  ]

  static getBySeriesNumber(seriesNumber: number) {
    return SeriesColor.seriesColorsRGB[seriesNumber % SeriesColor.seriesColorsRGB.length];
  }

  constructor(
    private red: number,
    private green: number,
    private blue: number) {

  }

  get background() {
    return `rgba(${this.red}, ${this.green}, ${this.blue}, 0.2)`
  }

  get border() {
    return `rgba(${this.red}, ${this.green}, ${this.blue}, 1)`
  }
}
